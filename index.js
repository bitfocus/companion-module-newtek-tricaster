const instance_skel = require('../../instance_skel');
const actions = require('./actions');
const tcp = require('../../tcp');
const { toXML } = require('jstoxml');
const xml2js = require('xml2js');
const { executeFeedback, initFeedbacks } = require('./feedbacks');

let debug;
let log;

class instance extends instance_skel {
	
	constructor(system, id, config) {
		super(system, id, config)
		
		Object.assign(this, {
			...actions,
			...feedbacks
		})
		
		this.tally = [];
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
		this.checkFeedbacks('tally_PGM');
		// this.tcp.send(cmd + '\n');
		console.log(cmd);
	}

	destroy() {

		debug("destroy", this.id);
	}

	convertXMLtoJSON(xmlString) {
		xml2js.parseString(xmlString, { mergeAttrs: true }, (err, result) => {
			if(err) {
					throw err;
			}
			// convert it to a JSON string
			const json = JSON.stringify(result, null, 4);
			console.log(json);
		});
	}
	init() {
		debug = this.debug;
		log = this.log;

		this.config.port = 5951;
		
		this.status(this.STATUS_UNKNOWN);
		this.initVariables();
		
		// Set tally information
		this.getTallyInformation();
		this.init_feedbacks();
		
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
		
		// Set product name
		this.getSystemInformation();
		
		// this.initPresets();
	}

	updateConfig(config) {

		this.config = config

		this.actions()

	}

	initVariables() {

		var variables = [
			{ name: 'product_name', label: 'Product name' },
			// { name: 'dynamic2', label: 'dynamic var2' },
		]

		this.setVariableDefinitions(variables)

	}

	init_feedbacks() {
		const feedbacks = initFeedbacks.bind(this)();
		this.setFeedbackDefinitions(feedbacks);
	}
	
	// Execute feedback
	feedback(feedback, bank) {
		return executeFeedback.bind(this)(feedback, bank);
	}

	getSystemInformation() {
		let data = '<product_information><product_model>TC1</product_model><product_name>TriCaster TC1</product_name><product_version>7-0</product_version><product_id>NCWL-WFKNJ8YAA-200918</product_id><product_serial_no/><product_build_no>7-0-180920</product_build_no><machine_name>TC1</machine_name><session_x_resolution>1920</session_x_resolution><session_y_resolution>1080</session_y_resolution><session_fielded>true</session_fielded><session_frame_rate>29.970030</session_frame_rate><session_aspect_ratio>1.777778</session_aspect_ratio><session_color_format>CCIR709</session_color_format><session_color_coding>NTSC</session_color_coding><session_name>TC1 Session</session_name></product_information>';
		xml2js.parseString(data, (err, result) => {
			if(err) {
					throw err;
			}
	
			this.setVariable('product_name', result.product_information.product_name)
		});
	}

	getTallyInformation() {
		let data = '\
			<tally>\
			<column name="input1" index="0" on_pgm="false" on_prev="false" ndi_id="0"/>\
			<column name="input2" index="1" on_pgm="true" on_prev="false" ndi_id="1"/>\
			<column name="input3" index="2" on_pgm="false" on_prev="false" ndi_id="2"/>\
			<column name="input4" index="3" on_pgm="false" on_prev="false" ndi_id="3"/>\
			<column name="input5" index="4" on_pgm="false" on_prev="false" ndi_id="4"/>\
			<column name="input6" index="5" on_pgm="false" on_prev="false" ndi_id="5"/>\
			<column name="input7" index="6" on_pgm="false" on_prev="false" ndi_id="6"/>\
			<column name="input8" index="7" on_pgm="false" on_prev="false" ndi_id="7"/>\
			<column name="input9" index="8" on_pgm="false" on_prev="false" ndi_id="8"/>\
			<column name="input10" index="9" on_pgm="false" on_prev="false" ndi_id="9"/>\
			<column name="input11" index="10" on_pgm="false" on_prev="false" ndi_id="10"/>\
			<column name="input12" index="11" on_pgm="false" on_prev="false" ndi_id="11"/>\
			<column name="input13" index="12" on_pgm="false" on_prev="false" ndi_id="12"/>\
			<column name="input14" index="13" on_pgm="false" on_prev="false" ndi_id="13"/>\
			<column name="input15" index="14" on_pgm="false" on_prev="false" ndi_id="14"/>\
			<column name="input16" index="15" on_pgm="false" on_prev="false" ndi_id="15"/>\
			<column name="bfr1" index="16" on_pgm="false" on_prev="false"/>\
			<column name="bfr2" index="17" on_pgm="false" on_prev="false"/>\
			<column name="bfr3" index="18" on_pgm="false" on_prev="false"/>\
			<column name="bfr4" index="19" on_pgm="false" on_prev="false"/>\
			<column name="bfr5" index="20" on_pgm="false" on_prev="false"/>\
			<column name="bfr6" index="21" on_pgm="false" on_prev="false"/>\
			<column name="bfr7" index="22" on_pgm="false" on_prev="false"/>\
			<column name="bfr8" index="23" on_pgm="false" on_prev="false"/>\
			<column name="bfr9" index="24" on_pgm="false" on_prev="false"/>\
			<column name="bfr10" index="25" on_pgm="false" on_prev="false"/>\
			<column name="bfr11" index="26" on_pgm="false" on_prev="false"/>\
			<column name="bfr12" index="27" on_pgm="false" on_prev="false"/>\
			<column name="bfr13" index="28" on_pgm="false" on_prev="false"/>\
			<column name="bfr14" index="29" on_pgm="false" on_prev="false"/>\
			<column name="bfr15" index="30" on_pgm="false" on_prev="false"/>\
			<column name="ddr1_a" index="31" on_pgm="false" on_prev="false"/>\
			<column name="ddr1_b" index="32" on_pgm="false" on_prev="false"/>\
			<column name="ddr2_a" index="33" on_pgm="false" on_prev="false"/>\
			<column name="ddr2_b" index="34" on_pgm="false" on_prev="false"/>\
			<column name="gfx1_a" index="35" on_pgm="false" on_prev="false"/>\
			<column name="gfx1_b" index="36" on_pgm="false" on_prev="false"/>\
			<column name="gfx2_a" index="37" on_pgm="false" on_prev="false"/>\
			<column name="gfx2_b" index="38" on_pgm="false" on_prev="false"/>\
			<column name="ddr1" index="39" on_pgm="false" on_prev="false"/>\
			<column name="ddr2" index="40" on_pgm="false" on_prev="false"/>\
			<column name="gfx1" index="41" on_pgm="true" on_prev="false"/>\
			<column name="gfx2" index="42" on_pgm="true" on_prev="false"/>\
			<column name="v1" index="43" on_pgm="false" on_prev="false"/>\
			<column name="v2" index="44" on_pgm="false" on_prev="false"/>\
			<column name="v3" index="45" on_pgm="false" on_prev="false"/>\
			<column name="v4" index="46" on_pgm="false" on_prev="false"/>\
			<column name="preview" index="47" on_pgm="false" on_prev="false"/>\
			<column name="me_preview" index="48" on_pgm="false" on_prev="false"/>\
			<column name="me_follow" index="49" on_pgm="false" on_prev="false"/>\
			<column name="previz" index="50" on_pgm="false" on_prev="false"/>\
			<column name="web_follow" index="51" on_pgm="false" on_prev="false"/>\
			<column name="sound" index="-2" on_pgm="false" on_prev="false"/>\
			<column name="black" index="-1" on_pgm="false" on_prev="false"/>\
			</tally>';

			xml2js.parseString(data, { mergeAttrs: true }, (err, result) => {
				if(err) {
						throw err;
				}
				// convert it to a JSON string
				// const json = JSON.stringify(result, null, 4);
				this.tally = result;
				// console.log(tally.tally['column']);
				this.checkFeedbacks('tally_PGM');
			});
	}

}

exports = module.exports = instance;
