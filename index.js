const instance_skel = require('../../instance_skel');
const actions = require('./actions');
const tcp = require('../../tcp');
const { toXML } = require('jstoxml');

let debug;
let log;

class instance extends instance_skel {

	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, { ...actions })

		this.actions()
	}

	actions(system) {
		this.setActions(this.getActions());
	}

	config_fields() {

		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module connects to a Tricaster.'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: this.REGEX_IP
			}
		]
	}

	action(action) {
		let id = action.action;
		let cmd;
		let opt = action.options;
		let attr = '';


		switch (id) {
			case 'take':
				attr = "main_background_take";
				break
			}
			
		cmd = toXML({
			shortcuts : {
				_name : 'shortcut',
				_attrs: {
					'name': 'main_background_take'
				}
			}
		});

		// this.tcp.send(cmd + '\n');
		console.log(cmd);
	}

	destroy() {

		debug("destroy", this.id);
	}

	init() {
		debug = this.debug;
		log = this.log;

		this.init_variables()
		this.config.port = 5951;

		this.status(this.STATUS_UNKNOWN);
		
		if (this.config.host !== undefined) {
			this.tcp = new tcp(this.config.host, this.config.port);

			this.tcp.on('status_change', function (status, message) {
				this.status(status, message);
			});

			this.tcp.on('error', function () {
				// Ignore
			});

			// Needed to receive feedback from the mixer
			this.tcp.send('\n');
		}

		// this.initPresets();
	}

	updateConfig(config) {

		this.config = config

		this.actions()

	}

	init_variables() {

		var variables = [
			{ name: 'dynamic1', label: 'dynamic variable' },
			// { name: 'dynamic2', label: 'dynamic var2' },
		]

		this.setVariableDefinitions(variables)

	}

}

exports = module.exports = instance;
