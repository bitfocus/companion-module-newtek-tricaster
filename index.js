const instance_skel = require('../../instance_skel');
const tcp           = require('../../tcp');
const WebSocket     = require('ws');
const actions       = require('./actions');
const presets       = require('./presets');
const { executeFeedback, initFeedbacks } = require('./feedbacks');

let debug;
let log;

class instance extends instance_skel {
	/**
	 * Main constructor
	 * @param  {} system
	 * @param  {} id
	 * @param  {} config
	 */
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...actions,
			...feedbacks,
			...presets
		})

		this.inputs = [];
		this.system_macros = [];
		this.tally = [];
		this.tally['PGM'] = null;
		this.tally['PVW'] = null;
		this.tally['ME1'] = null;
	}
	
	/**
	 * The main config fields for user input like IP address
	 */
	config_fields() {
		return [
			{
				type:  'text',
				id:    'info',
				width:  12,
				label: 'Information',
				value: 'This module connects to a Tricaster.'
			},
			{
				type:  'textinput',
				id:    'host',
				label: 'Target IP',
				width:  6,
				regex:  this.REGEX_IP
			}
		]
	}

	/**
	 * Set all the actions
	 * @param  {} system
	 */
	actions(system) {
		this.setActions(this.getActions());
	}

	/**
	 * Handle stuff when modules gets destroyed
	 */
	destroy() {
		debug("destroy", this.id);
		this.active = false;
	}

	/**
	 * Start of the module
	 */
	init() {
		debug = this.debug;
		log = this.log;
		this.active = true;

		this.status(this.STATUS_UNKNOWN);

		this.init_variables();
		this.init_feedbacks();
		
		this.init_TCP();
		
		// Get all initial info needed
		this.sendGetRequest(`http://${this.config.host}/v1/version`); // Fetch mixer info
		// this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch initial tally info
		this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher info including tally
		this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=macros_list`) // Fetch macros
		
		this.init_presets();
	}
		
	/**
	 * Called when config has been updated
	 * @param  {} config
	 */
	updateConfig(config) {
		this.config = config
		this.status(this.STATUS_UNKNOWN);

		this.init_variables();
		this.init_feedbacks();
		
		this.init_TCP();
		
		// Get all initial info needed
		this.sendGetRequest(`http://${this.config.host}/v1/version`); // Fetch mixer info
		// this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch initial tally info
		this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher info including tally
		this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=macros_list`) // Fetch macros
		
		this.init_presets();
	}

	/**
	 * Set the TCP connection to send shortcuts to the mixer, should be the fastest option
	*/
	init_TCP () {
		this.config.port = 5951; // Fixed port

		if (this.config.host !== undefined) {
			if (this.socket !== undefined) {
				this.socket.destroy();
				delete this.socket;
			}

			this.status(this.STATE_WARNING, 'Connecting');
			if (this.config.host) {
				this.socket = new tcp(this.config.host, this.config.port);

				this.socket.on('status_change', (status, message) => {
					this.status(status, message); // Update status when something happens
				});

				this.socket.on('error', (err) => {
					debug("Network error", err);
					this.status(this.STATE_ERROR, err);
					this.log('error', "Network error: " + err.message);
				});

				this.socket.on('connect', () => {
					this.status(this.STATE_OK);
					debug("TriCaster shortcut socket Opened");
					this.init_websocket_listener();
				})
			}
		}
	}

	/**
	 * Initialize presets
	 * @param  {} updates
	 */
	init_presets(updates) {
		this.setPresetDefinitions(this.getPresets());
	}

	/**
	 * Send a REST GET request to the switcher and handle errorcodes
	 * @param  {} url
	 */
	sendGetRequest(url) {
		debug('Requesting the following url:', url);
		this.system.emit('rest_get', url, (err, result) => {
			if (err !== null) {
				this.status(this.STATUS_ERROR, result.error.code);
				this.log('error', 'Connection failed (' + result.error.code + ')');
				this.retryConnection();     
			}
			else {
				if (result.response.statusCode == 200) {
					this.status(this.STATUS_OK);
					this.processData(result.data);
				} else if (result.response.statusCode == 401) {     // mmm password?
					this.status(this.STATUS_ERROR, "Password needed?");
					this.log('error', "Password? HTTP status code: " + result.response.statusCode);
				} else {
					this.status(this.STATUS_ERROR, "Unespected HTTP status code: " + result.response.statusCode);
					this.log('error', "Unespected HTTP status code: " + result.response.statusCode);
				}
			}
		});
	}
	
	/**
	 * When connection fails, try again
	 */
	retryConnection() {
		// TODO
	}

	/**
	 * Process incoming data from the websocket connection
	 * @param  {} data
	 */
	processData(data) {
		if(data['tally'] !== undefined ) { // Set PGM and PVW variable/Feedback
			// console.log('tally info', data['tally']['column']);
			// data['tally']['column'].forEach(element => {
			// 	if(element['$']['on_pgm'] == 'true' ) {
			// 		this.setVariable('pgm_source', element['$']['name']);
			// 		this.tallyPGM = element['$']['name'];
			// 	}
			// 	if(element['$']['on_prev'] == 'true' ) {
			// 		this.setVariable('pvw_source', element['$']['name']);
			// 		this.tallyPVW = element['$']['name'];
			// 	}
			// });
			// console.log('in tally process', this.tallyPVW);
			// this.checkFeedbacks('Tally_PGM');
			// this.checkFeedbacks('Tally_PVW');
		}
		if (data['product_information'] !== undefined) {
			this.log('info', `Connected to: ${data['product_information']['product_name']} at ${this.config.host}`);
			this.setVariable('product_name', data['product_information']['product_name'])
			this.setVariable('product_version', data['product_information']['product_version'])
		}
		if (data['switcher_update'] !== undefined) {
			let source_on_main = data['switcher_update']['$']['main_source'];
			let source_on_preview = data['switcher_update']['$']['preview_source'];
			// Create a object with inputs
			let counter = 0;
			this.inputs.length = 0;
			data['switcher_update']['inputs']['physical_input'].forEach(element => {
				this.inputs.push({ 'id': counter, 'label': element['$']['button_label'], 'iso_label': element['$']['iso_label'], 'button_label': element['$']['button_label'], 'physical_input_number': element['$']['physical_input_number'] })
				if (source_on_main.toLowerCase() == element['$']['physical_input_number'].toLowerCase()) { 
					this.tally['PGM'] = counter;
					this.setVariable('pgm_source', element['$']['iso_label']);
				}
				if (source_on_preview.toLowerCase() == element['$']['physical_input_number'].toLowerCase()) { 
					this.setVariable('pvw_source', element['$']['iso_label']);
					this.tally['PVW'] = counter;
				}
				counter++;
			});
			this.actions(); // Set the actions after info is retrieved
			this.init_feedbacks(); // Same for feedback as it holds the inputs
			this.init_presets();
			this.checkFeedbacks('tally_PGM'); // Check directly, which source is active
			this.checkFeedbacks('tally_PVW'); // Check directly, which source is on preview
			this.checkFeedbacks('tally_ME1'); // Check directly, which source is on ME/1
		} 
		if (data['macros'] !== undefined) {
			// Fetch all macros
			data['macros']['systemfolder']['macro'].forEach(element => {
				this.system_macros.push({ 'id': element['$']['identifier'], 'label': element['$']['name'] })
			});
			this.actions(); // Reset the actions, marco's could be updated
		} if(data['shortcut_states'] !== undefined) {
			// console.log(data['shortcut_states']['shortcut_state']);
		}
	}
	
	/**
	 * Set variable definitions
	 */
	init_variables() {
		var variables = [
			{ name: 'product_name', label: 'Product name' },
			{ name: 'product_version', label: 'Product version' },
			{ name: 'pgm_source', label: 'Source on Program' },
			{ name: 'pvw_source', label: 'Source on Preview' },
		]
		this.setVariableDefinitions(variables)
	}

	/**
	 * Set available feedback choices
	 */
	init_feedbacks() {
		const feedbacks = initFeedbacks.bind(this)();
		this.setFeedbackDefinitions(feedbacks);
	}

	/**
	 * Execute feedback
	 * @param  {} feedback
	 * @param  {} bank
	 */
	feedback(feedback, bank) {
		return executeFeedback.bind(this)(feedback, bank);
	}
	
	/**
	 * Create a WebSocket connection for retrieving updates
	 */
	init_websocket_listener() {
		const url = 'ws://' + this.config.host + '/v1/change_notifications';
		const ws = new WebSocket(url);

		ws.on('open', () => {
			// ping server every 15 seconds to keep connection open
			const interval = setInterval(function () {
				// readyState 1 = OPEN
				if (ws.readyState == 1) {
					ws.send('keep alive');
				}
				// readyState 2 = CLOSING, readyState 3 = CLOSED
				else if (ws.readyState == 2 || ws.readyState == 3) {
					clearInterval(interval);
				}
			}, 15000);

			console.log("TriCaster Listener WebSocket Opened");
		});

		ws.on('message', (msg) => {
			if (msg.search('switcher') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher info
			} 
			if (msg.search('tally') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch initial tally info
			} 
			if (msg.search('shortcut_states') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=shortcut_states`) // Fetch initial tally info
			}	else {
				debug(msg);
			}
		});

		ws.on('onclose', () => {
			console.log('Strange, socket is closed');
		});

		ws.on('onerror', (msg) => {
			console.log('Error', msg.data);
		})
	}

		/**
	 * Process all executed actions (by user)
	 * @param  {} action
	 */
	action(action) {
		let id  = action.action;
		let opt = action.options;
		let cmd = '';

		switch (id) {
			case 'take':
				cmd = `<shortcuts><shortcut name="main_background_take" /></shortcuts>`;
				break;
			case 'macros':
				cmd = `<shortcuts><shortcut name="play_macro_byid" value="${opt.macro}" /></shortcuts>`;
				break;
			case 'source_pgm':
				cmd = `<shortcuts><shortcut name="main_a_row" value="${opt.source}" /></shortcuts>`;
				this.tallyPGM = opt.source; // Do we wait for feedback or set it directly?
				break;
			case 'source_pvw':
				cmd = `<shortcuts><shortcut name="main_b_row" value="${opt.source}" /></shortcuts>`;
				this.tallyPVW = opt.source; // Do we wait for feedback or set it directly?
				break;
			case 'source_v1_a_row':
				cmd = `<shortcuts><shortcut name="v1_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v2_a_row':
				cmd = `<shortcuts><shortcut name="v2_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v3_a_row':
				cmd = `<shortcuts><shortcut name="v3_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v4_a_row':
				cmd = `<shortcuts><shortcut name="v4_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v5_a_row':
				cmd = `<shortcuts><shortcut name="v5_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v6_a_row':
				cmd = `<shortcuts><shortcut name="v6_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v7_a_row':
				cmd = `<shortcuts><shortcut name="v7_a_row" value="${opt.source}" /></shortcuts>`;
				break;
			case 'source_v8_a_row':
				cmd = `<shortcuts><shortcut name="v8_a_row" value="${opt.source}" /></shortcuts>`;
				break;

			case 'custom':
				cmd = opt.custom;
				break;
		}

		if (cmd !== '') {
			// send the xml to TCP socket
			this.socket.send(cmd + '\n');
			console.log(cmd);
		} else {
			// mmm do matching action found?
		}
		this.checkFeedbacks('tally_PGM');
		this.checkFeedbacks('tally_PVW');
		this.checkFeedbacks('tally_ME1');
	}
}

exports = module.exports = instance;
