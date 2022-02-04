const instance_skel = require('../../instance_skel')
const tcp = require('../../tcp')
const WebSocket = require('ws')
const actions = require('./actions')
const presets = require('./presets')
const ping = require('ping')
const parseString = require('xml2js').parseString
const util = require('util')
const { executeFeedback, initFeedbacks } = require('./feedbacks')
const { findIndex } = require('lodash')

let debug
let log

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
			...presets,
		})

		this.switcher = []
		this.inputs = []
		this.system_macros = []
		this.tally = []
		this.tallyPVW = []
		this.tallyPGM = []
		this.datalink = []
		this.shortcut_states = []
		this.variables = []
		this.mediaTargets = []
		this.mediaSourceNames = []
		this.meDestinations = []
		this.dskDestinations = []
		this.createDskDestinations()
		this.createMediaTargets()
		this.createMeDestinations()
	}

	static GetUpgradeScripts() {
		return [
			instance_skel.CreateConvertToBooleanFeedbackUpgradeScript({
				tally_PGM: true,
				tally_PVW: true,
				tally_record: true,
				tally_streaming: true,
				play_media: true,
			}),
		]
	}

	createMeDestinations() {
		for (let index = 1; index < 9; index++) {
			this.meDestinations.push({
				id: `v${index}_a_row`,
				label: `M/E ${index} PGM`,
			})
			this.meDestinations.push({
				id: `v${index}_b_row`,
				label: `M/E ${index} PVW`,
			})
			for (let dsk = 1; dsk < 5; dsk++) {
				this.dskDestinations.push({
					id: `v${index}_dsk${dsk}`,
					label: `M/E ${index} DSK ${dsk}`,
				})
			}
		}
	}

	createDskDestinations() {
		for (let dsk = 1; dsk < 5; dsk++) {
			this.dskDestinations.push({
				id: `main_dsk${dsk}`,
				label: `main dsk ${dsk}`,
			})
		}
	}
	/**
	 * Creating of media targets
	 */
	createMediaTargets() {
		for (let index = 1; index < 5; index++) {
			this.mediaTargets.push({
				id: `ddr${index}_play`,
				label: `DDR ${index} Play`,
			})
			this.mediaTargets.push({
				id: `ddr${index}_play_toggle`,
				label: `DDR ${index} Play Toggle`,
			})
			this.mediaTargets.push({
				id: `ddr${index}_stop`,
				label: `DDR ${index} Stop`,
			})
			this.mediaTargets.push({
				id: `ddr${index}_back`,
				label: `DDR ${index} Back`,
			})
			this.mediaTargets.push({
				id: `ddr${index}_forward`,
				label: `DDR ${index} Forward`,
			})
			this.mediaTargets.push({
				id: `ddr${index}_mark_in`,
				label: `DDR ${index} Mark In`,
			})
			this.mediaTargets.push({
				id: `ddr${index}_mark_out`,
				label: `DDR ${index} Mark Out`,
			})
			this.mediaSourceNames.push({
				id: `ddr${index}`,
				label: `DDR ${index}`,
			})
		}
		for (let index = 1; index < 3; index++) {
			this.mediaTargets.push({
				id: `gfx${index}_play`,
				label: `GFX ${index} Play`,
			})
			this.mediaTargets.push({
				id: `gfx${index}_play_toggle`,
				label: `GFX ${index} Play Toggle`,
			})
			this.mediaTargets.push({
				id: `gfx${index}_stop`,
				label: `GFX ${index} Stop`,
			})
			this.mediaTargets.push({
				id: `gfx${index}_back`,
				label: `GFX ${index} Back`,
			})
			this.mediaTargets.push({
				id: `gfx${index}_forward`,
				label: `GFX ${index} Forward`,
			})
			this.mediaSourceNames.push({
				id: `gfx${index}`,
				label: `GFX ${index}`,
			})
		}
		this.mediaTargets.push({
			id: `stills_play`,
			label: `Stills Play`,
		})
		this.mediaSourceNames.push({
			id: `stills`,
			label: `Stills`,
		})
		this.mediaTargets.push({
			id: `stills_play_toggle`,
			label: `Stills Play Toggle`,
		})
		this.mediaTargets.push({
			id: `stills_stop`,
			label: `Stills Stop`,
		})
		this.mediaTargets.push({
			id: `stills_back`,
			label: `Stills Back`,
		})
		this.mediaTargets.push({
			id: `stills_forward`,
			label: `Stills Forward`,
		})

		this.mediaTargets.push({
			id: `titles_play`,
			label: `Titles Play`,
		})
		this.mediaTargets.push({
			id: `titles_play_toggle`,
			label: `Titles Play Toggle`,
		})
		this.mediaTargets.push({
			id: `titles_stop`,
			label: `Titles Stop`,
		})
		this.mediaTargets.push({
			id: `titles_back`,
			label: `Titles Back`,
		})
		this.mediaTargets.push({
			id: `titles_forward`,
			label: `Titles Forward`,
		})
		this.mediaSourceNames.push({
			id: `titles`,
			label: `Titles`,
		})
		this.mediaSourceNames.push({
			id: `sound`,
			label: `Sound`,
		})
	}
	/**
	 * The main config fields for user input like IP address
	 */
	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module connects to a Tricaster.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Tricaster IP',
				width: 6,
				regex: this.REGEX_IP,
			},
			{
				type: 'text',
				id: 'info',
				width: 10,
				label: 'Polling Information',
				value: 'Polling is required for DataLink variables (0 for off, interval must be 500ms or larger)',
			},
			{
				type: 'textinput',
				id: 'pollInterval',
				label: 'Polling Interval',
				width: 4,
				default: '0',
			},
		]
	}

	/**
	 * Set all the actions
	 * @param  {} system
	 */
	actions(system) {
		this.setActions(this.getActions())
	}

	/**
	 * Handle stuff when modules gets destroyed
	 */
	destroy() {
		debug('destroy', this.id)
		this.active = false
		if (this.pollAPI) {
			clearInterval(this.pollAPI)
		}
		if (this.ws !== undefined) {
			this.ws.close(1000)
			delete this.ws
		}
	}

	/**
	 * Start of the module
	 */
	init() {
		debug = this.debug
		log = this.log
		this.active = true

		this.status(this.STATUS_UNKNOWN)

		this.set_variablesDefinition()
		this.connections()
	}

	connections() {
		// Settings must be made first
		if (this.config.host !== undefined) {
			// Get all initial info needed
			this.sendGetRequest(`http://${this.config.host}/v1/version`) // Fetch mixer info
			this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch initial input info
			this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=macros_list`) // Fetch macros
			this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher changes
			if (this.config.pollInterval != 0) {
				this.sendGetRequest(`http://${this.config.host}/v1/datalink`) // Fetch datalink stuff
				if (this.pollAPI) {
					clearInterval(this.pollAPI)
				}
				this.pollAPI = setInterval(
					() => {
						this.sendGetRequest(`http://${this.config.host}/v1/datalink`) // Fetch datalink stuff
					},
					this.config.pollInterval < 500 ? 500 : this.config.pollInterval
				)
			}
			this.init_TCP()
			this.init_feedbacks()
			this.init_presets()
			this.status(this.STATE_OK)
		} else {
			this.status(this.STATE_ERROR, 'No ping reply from ' + this.config.host)
			this.log('error', 'Network error: cannot reach IP address')
		}
	}
	/**
	 * Called when config has been updated
	 * @param  {} config
	 */
	updateConfig(config) {
		this.config = config
		this.status(this.STATUS_UNKNOWN)
		clearInterval(this.pollAPI)

		this.init_feedbacks()
		this.connections()
		this.set_variablesDefinition()
	}

	set_variablesDefinition(extra) {
		if (this.variables.length == 0) {
			this.variables = [
				{
					name: 'product_name',
					label: 'Product name',
				},
				{
					name: 'product_version',
					label: 'Product version',
				},
				{
					name: 'pgm_source',
					label: 'Source on Program',
				},
				{
					name: 'pvw_source',
					label: 'Source on Preview',
				},
				{
					name: 'recording',
					label: 'Recording',
				},
				{
					name: 'streaming',
					label: 'Streaming',
				},
			]
		}

		if (extra != undefined && Array.isArray(extra)) {
			extra.forEach((element) => {
				const index = this.variables.findIndex((el) => el.name == element.name)
				if (index == -1) this.variables.push(element)
			})
			this.setVariableDefinitions(this.variables)
		} else {
			this.setVariableDefinitions(this.variables)
		}
	}
	/**
	 * Set the TCP connection to send shortcuts to the mixer, should be the fastest option
	 */
	init_TCP() {
		this.config.port = 5951 // Fixed port
		this.inputBuffer = Buffer.from('')

		if (this.config.host !== undefined) {
			if (this.socket !== undefined) {
				this.socket.destroy()
				delete this.socket
			}

			this.status(this.STATE_WARNING, 'Connecting')
			this.socket = new tcp(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.status(status, message) // Update status when something happens
			})
			this.socket.on('error', (err) => {
				if (err.errno === 'ECONNREFUSED') {
					this.log('TCP error: ' + err)
					this.status(this.STATE_ERROR, err)
				} else {
					this.status(this.STATE_ERROR, err)
					debug('Network error', err)
					this.log('error', 'Network error: ' + err.message)
				}
			})

			this.socket.on('connect', () => {
				this.status(this.STATE_OK)
				// Ask the mixer to give us variable (register/state) updates on connection
				this.socket.send(`<register name="NTK_states"/>\n`)

				this.debug('TriCaster shortcut socket Opened')
				this.init_websocket_listener()
			})

			this.socket.on('data', (inputData) => {
				clearTimeout(this.errorTimer)

				this.inputBuffer = Buffer.concat([this.inputBuffer, inputData])

				parseString(Buffer.from('<root>' + this.inputBuffer.toString() + '</root>'), (err, result) => {
					if (!err) {
						this.inputBuffer = Buffer.from('')
						this.incomingData(result.root)
					} else {
						this.errorTimer = setTimeout(() => {
							throw 'Timeout getting a complete xml packet'
						}, 500)
					}
				})
			})
		}
	}

	init_websocket_listener() {
		clearInterval(this.reconnect)

		if (this.ws !== undefined) {
			this.ws.close(1000)
			delete this.ws
		}

		const url = 'ws://' + this.config.host + '/v1/change_notifications'
		this.ws = new WebSocket(url)

		this.ws.on('open', () => {
			// ping server every 15 seconds to keep connection open

			this.websocketPing = setInterval(() => {
				if (this.ws) {
					if (this.ws.readyState == 1) {
						this.ws.send('keep alive')
					}
					// readyState 2 = CLOSING, readyState 3 = CLOSED
					else if (this.ws.readyState == 2 || this.ws.readyState == 3 || this.ws) {
						clearInterval(this.websocketPing)
					}
				} else {
					clearInterval(this.websocketPing)
				}
			}, 15000)

			this.debug('TriCaster Listener WebSocket Opened')
		})

		this.ws.on('message', (msg) => {
			this.debug(msg)
			if (msg.search('tally') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch tally changes
			}
			if (msg.search('switcher') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher changes
			}
		})

		this.ws.on('onclose', () => {
			if (code !== 1000) {
				this.debug('error', `Websocket closed:  ${code}`)
				this.reconnect = setInterval(() => {
					this.init_websocket_listener()
				}, 500)
			}
		})

		this.ws.on('onerror', (msg) => {
			this.debug('Error', msg.data)
		})
	}

	/**
	 * @param  {} states
	 */
	shortcutStatesIngest(states) {
		states.forEach((element) => {
			if (element['$']['name'] == 'preview_tally') {
			} else if (element['$']['name'] == 'program_tally') {
			} else if (element['$']['name'].match(/_short_name/)) {
				const index = this.inputs.findIndex((el) => el.name == element['$']['name'].slice(0, -11))
				if (index != -1) {
					this.inputs[index].short_name = element['$']['value']
					this.setVariable(this.inputs[index].name, element['$']['value'])
				}
				const va_index = this.meDestinations.findIndex(
					(el) => el.label.slice(0, -6) == element['$']['name'].slice(0, -11)
				)
				if (va_index != -1) {
					this.meDestinations[va_index].label = element['$']['value'] + ' a bus'
				}
				const vb_index = this.meDestinations.findIndex(
					(el) => el.label.slice(0, -6) == element['$']['name'].slice(0, -11)
				)
				if (vb_index != -1) {
					this.meDestinations[vb_index].label = element['$']['value'] + ' b bus'
				}
			} else if (element['$']['name'].match(/_long_name/)) {
				const index = this.inputs.findIndex((el) => el.name == element['$']['name'].slice(0, -10))
				if (index != -1) {
					this.inputs[index].long_name = element['$']['value']
					this.inputs[index].label = element['$']['value']
				}
			} else if (element['$']['name'].match(/record_toggle/)) {
				this.switcher['recording'] = element['$']['value'] == '1' ? true : false
				this.setVariable('recording', element['$']['value'] == '1' ? true : false)
				this.checkFeedbacks('tally_record')
			} else if (element['$']['name'].match(/streaming_toggle/)) {
				this.switcher['streaming'] = element['$']['value'] == '1' ? true : false
				this.setVariable('streaming', element['$']['value'] == '1' ? true : false)
				this.checkFeedbacks('tally_streaming')
			} else if (
				element['$']['name'].match(/ddr1_play/) ||
				element['$']['name'].match(/ddr2_play/) ||
				element['$']['name'].match(/ddr3_play/) ||
				element['$']['name'].match(/ddr4_play/) ||
				element['$']['name'].match(/gfx1_play/) ||
				element['$']['name'].match(/gfx2_play/) ||
				element['$']['name'].match(/stills_play/) ||
				element['$']['name'].match(/titles_play/) ||
				element['$']['name'].match(/sound_play/)
			) {
				this.shortcut_states[element['$']['name']] = element['$']['value']
				this.checkFeedbacks('play_media')
			}
		})
		this.checkFeedbacks('tally_PVW')
		this.checkFeedbacks('tally_PGM')
		this.checkFeedbacks('tally_streaming')
	}
	/**
	 * @param  {} data
	 */
	incomingData(data) {
		if (data.shortcut_states !== undefined) {
			if (Array.isArray(data.shortcut_states)) {
				data.shortcut_states.forEach((states) => {
					this.shortcutStatesIngest(states.shortcut_state)
				})
			} else {
				this.shortcutStatesIngest(data.shortcut_states.shortcut_state)
			}
			this.actions()
			this.init_presets()
		} else {
			this.debug('UNKNOWN INCOMING DATA', util.inspect(data, false, null, true))
		}
	}

	/**
	 * Initialize presets
	 * @param  {} updates
	 */
	init_presets(updates) {
		this.setPresetDefinitions(this.getPresets())
	}

	/**
	 * Send a REST GET request to the switcher and handle errorcodes
	 * @param  {} url
	 */
	sendGetRequest(url) {
		this.debug('Requesting the following url:', url)
		this.system.emit('rest_get', url, (err, result) => {
			if (err !== null) {
				this.status(this.STATUS_ERROR, result.error.code)
				this.log('error', 'Connection failed (' + result.error.code + ')')
			} else {
				if (result.response.statusCode == 200) {
					this.status(this.STATUS_OK)
					this.processData(result.data)
				} else if (result.response.statusCode == 401) {
					// mmm password?
					this.status(this.STATUS_ERROR)
					this.log('error', 'On the Tricaster under Administration Tools, turn off the LivePanel password')
				} else {
					this.status(this.STATUS_ERROR, 'Unexpected HTTP status code: ' + result.response.statusCode)
					this.log('error', 'Unexpected HTTP status code: ' + result.response.statusCode)
				}
			}
		})
	}

	/**
	 * Process incoming data from the rest connection
	 * @param  {} data
	 */
	processData(data) {
		if (data['tally'] !== undefined) {
			// Set PGM and PVW variable/Feedback
			this.tallyPVW = []
			this.tallyPGM = []
			if (this.inputs.length == 0) {
				let variables = []
				this.debug('Load initial Data')
				data['tally']['column'].forEach((element) => {
					//Prevent excess DDR/GFX A/B Inputs from being visible
					if (!element['$']['name'].match(/[d,g][d,f][r,x][1-2](_)[a,b]/i)) {
						this.inputs.push({
							id: element['$']['index'],
							label: element['$']['name'],
							name: element['$']['name'],
							long_name: element['$']['name'],
							short_name: element['$']['name'],
						})
						variables.push({ name: `${element['$']['name']}`, label: element['$']['name'] })
					}
				})
				this.set_variablesDefinition(variables)
				this.init_feedbacks() // Same for feedback as it holds the inputs
			}
			data['tally']['column'].forEach((element) => {
				element['$']['on_prev'] == 'true'
					? (this.tallyPVW[element['$']['index']] = 'true')
					: (this.tallyPVW[element['$']['index']] = 'false')
				element['$']['on_pgm'] == 'true'
					? (this.tallyPGM[element['$']['index']] = 'true')
					: (this.tallyPGM[element['$']['index']] = 'false')
			})

			this.checkFeedbacks('tally_PGM') // Check directly, which source is active
			this.checkFeedbacks('tally_PVW') // Check directly, which source is on preview
		} else if (data['product_information'] !== undefined) {
			this.log('info', `Connected to: ${data['product_information']['product_name']} at ${this.config.host}`)
			this.switcher['product_name'] = data['product_information']['product_name']
			this.switcher['product_version'] = data['product_information']['product_version']

			this.setVariable('product_name', data['product_information']['product_name'])
			this.setVariable('product_version', data['product_information']['product_version'])
		} else if (data['switcher_update'] !== undefined) {
			let pgmSource = data['switcher_update']['$']['main_source']
			let pvwSource = data['switcher_update']['$']['preview_source']

			pgmSource = this.inputs.find((el) => el.name == pgmSource.toLowerCase())
			pvwSource = this.inputs.find((el) => el.name == pvwSource.toLowerCase())

			this.setVariable(
				'pgm_source',
				pgmSource?.short_name ? pgmSource.short_name : data['switcher_update']['$']['main_source']
			)
			this.setVariable(
				'pvw_source',
				pvwSource?.short_name ? pvwSource.short_name : data['switcher_update']['$']['preview_source']
			)

			this.actions() // Set the actions after info is retrieved
			this.init_feedbacks() // Same for feedback as it holds the inputs
			this.init_presets()
			this.checkFeedbacks('tally_PGM') // Check directly, which source is active
			this.checkFeedbacks('tally_PVW') // Check directly, which source is on preview
		} else if (data['macros'] !== undefined) {
			// Fetch all macros
			data['macros']['systemfolder']['macro'].forEach((element) => {
				this.system_macros.push({
					id: element['$']['name'],
					label: element['$']['name'],
				})
			})
			this.actions() // Reset the actions, marco's could be updated
		} else if (data['shortcut_states'] !== undefined) {
			// Handled by TCP states
		} else if (data['datalink_values'] !== undefined) {
			// This is done by polling
			let variables = []
			let _datalink = []
			data['datalink_values']['data'].forEach((element) => {
				if (this.datalink[element.key] != element.value) this.setVariable(element.key, element.value)
				_datalink[element.key] = element.value
				variables.push({ name: element.key, label: element.key })
			})

			this.datalink = _datalink
			this.set_variablesDefinition(variables)
		} else {
			// this.debug('data from request',data);
		}
	}

	/**
	 * Set available feedback choices
	 */
	init_feedbacks() {
		const feedbacks = initFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	/**
	 * Execute feedback
	 * @param  {} feedback
	 * @param  {} bank
	 */
	feedback(feedback, bank) {
		return executeFeedback.bind(this)(feedback, bank)
	}

	/**
	 * Process all executed actions (by user)
	 * @param  {} action
	 */
	action(action) {
		let id = action.action
		let opt = action.options
		let cmd = ''

		switch (id) {
			case 'take':
				cmd = `<shortcuts><shortcut name="main_background_take" /></shortcuts>`
				break
			case 'auto':
				cmd = `<shortcuts><shortcut name="main_background_auto" /></shortcuts>`
				break
			case 'auto_dsk':
				cmd = `<shortcuts><shortcut name="main_${opt.dsk}_auto" /></shortcuts>`
				break
			case 'streaming':
				cmd = `<shortcuts><shortcut name="streaming_toggle" value="${parseInt(opt.force)}" /></shortcuts>`
				this.switcher['streaming'] = opt.force == '1' ? true : false
				this.setVariable('streaming', opt.force == '1' ? true : false)
				this.debug(cmd)
				break
			case 'source_pgm':
				cmd = `<shortcuts><shortcut name="main_a_row" value="${opt.source}" /></shortcuts>`
				this.tallyPGM = opt.source // Do we wait for feedback or set it directly?
				break
			case 'source_pvw':
				cmd = `<shortcuts><shortcut name="main_b_row" value="${opt.source}" /></shortcuts>`
				this.tallyPVW = opt.source // Do we wait for feedback or set it directly?
				break
			case 'source_to_v':
				cmd = `<shortcuts><shortcut name="${opt.destination}" value="${opt.source}" /></shortcuts>`
				break
			case 'source_to_dsk':
				cmd = `<shortcuts><shortcut name="${opt.dskDestinations}_select" value="${opt.source}" /></shortcuts>`
				break
			case 'media_target':
				cmd = `<shortcuts><shortcut name="${opt.target}" /></shortcuts>`
				break
			case 'autoplay_mode_toggle':
				cmd = `<shortcuts><shortcut name="${opt.target}_autoplay_mode_toggle" value="${opt.toggle}" /></shortcuts>`
				break
			case 'record_start':
				cmd = `<shortcuts><shortcut name="record_start" /></shortcuts>`
				break
			case 'record_stop':
				cmd = `<shortcuts><shortcut name="record_stop" /></shortcuts>`
				break
			case 'tbar':
				cmd = `<shortcuts><shortcut name="main_value" /></shortcuts>`
				break
			case 'datalink':
				cmd = `<shortcuts><shortcut name="set_datalink"><entry key="datalink_key" value="${opt.datalink_key}" /><entry key="datalink_value" value="${opt.datalink_value}"/></shortcut></shortcuts>`
				break
			case 'audio_volume':
				cmd = `<shortcuts><shortcut name="${opt.source}_volume" value="${opt.volume}" /></shortcuts>`
				break
			case 'audio_mute':
				cmd = `<shortcuts><shortcut name="${opt.source}_mute" value="${opt.mute}" /></shortcuts>`
				break
			case 'load_save_v':
				cmd = `<shortcuts><shortcut name="${opt.v}${opt.loadSave}" value="${opt.preset}" /></shortcuts>`
				break
			case 'transition_speed_number':
				cmd = `<shortcuts><shortcut name="main_background_speed" value="${opt.speed}" /></shortcuts>`
				break
			case 'transition_speed':
				cmd = `<shortcuts><shortcut name="${opt.speed}" /></shortcuts>`
				break
			case 'transition_index':
				cmd = `<shortcuts><shortcut name="main_background_select_index" value="${opt.type}" /></shortcuts>`
				break
			case 'previz_dsk_auto':
				cmd = `<shortcuts><shortcut name="previz_${opt.dsk}_auto" /></shortcuts>`
				break
			case 'custom':
				cmd = opt.custom
				break
			case 'trigger':
				this.debug(`http://${this.config.host}/v1/trigger?name=${opt.macro}`)
				this.system.emit('rest_get', `http://${this.config.host}/v1/trigger?name=${opt.macro}`, (err, res) => {
					this.debug(res)
				})
				break
		}

		if (cmd !== '') {
			// send the xml to TCP socket
			this.socket.send(cmd + '\n')
			// this.debug(cmd)
		} else {
			// mmm do matching action found?
		}
		this.checkFeedbacks('tally_PGM')
		this.checkFeedbacks('tally_PVW')
		this.checkFeedbacks('tally_streaming')
	}
}

exports = module.exports = instance
