export function getActions() {
	return {
		take: {
			name: 'Take',
			options: [
				{
					label: 'M/E',
					type: 'dropdown',
					choices: this.meList,
					id: 'v',
					default: 'main',
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.v}_take`)
			},
		},
		auto: {
			name: 'Auto transition',
			options: [
				{
					label: 'M/E',
					type: 'dropdown',
					choices: this.meList,
					id: 'v',
					default: 'main',
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.v}_auto`)
			},
		},
		auto_dsk: {
			name: 'Auto transition DSK',
			options: [
				{
					label: 'Choose dsk',
					type: 'dropdown',
					choices: [
						{ id: 'dsk1', label: 'DSK 1' },
						{ id: 'dsk2', label: 'DSK 2' },
						{ id: 'dsk3', label: 'DSK 3' },
						{ id: 'dsk4', label: 'DSK 4' },
					],
					id: 'dsk',
					default: 'dsk1',
				},
			],
			callback: (action) => {
				this.sendCommand(`main_${action.options.dsk}_auto`)
			},
		},
		record_start: {
			label: 'Record Start',
			options: [],
			callback: () => {
				this.sendCommand(`record_start`)
			},
		},
		record_stop: {
			label: 'Record Stop',
			options: [],
			callback: () => {
				this.sendCommand(`record_stop`)
			},
		},
		streaming: {
			name: 'Streaming',
			options: [
				{
					label: 'on/off',
					id: 'force',
					type: 'dropdown',
					choices: [
						{ id: 1, label: 'on' },
						{ id: 0, label: 'off' },
					],
					default: 1,
				},
			],
			callback: (action) => {
				this.sendCommand(`streaming_toggle`, `${parseInt(action.options.force)}`)
			},
		},
		trigger: {
			name: 'Trigger Custom Macro',
			options: [
				{
					label: 'Macro Name',
					type: 'dropdown',
					choices: this.custom_macros,
					id: 'macro',
					default: this.custom_macros[0] ? this.custom_macros[0].id : '',
				},
			],
			callback: (action) => {
				this.sendCommand(`play_macro_byname`, `${action.options.macro}`)
			},
		},
		macros: {
			name: 'Run system macro',
			options: [
				{
					label: 'Select macro',
					type: 'dropdown',
					id: 'macro',
					choices: this.system_macros,
					default: 'Stream: Start',
				},
			],
			callback: (action) => {
				///CHECK THIS OUT
				this.sendCommand(`play_macro_byname`, `${action.options.macro}`)
			},
		},
		source_pvw: {
			name: 'Set source to preview',
			options: [
				{
					label: 'Sources',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: 0,
				},
			],
			callback: (action) => {
				this.sendCommand(`main_b_row`, `${action.options.source}`)
			},
		},
		source_pgm: {
			name: 'Set source to program',
			options: [
				{
					label: 'Sources',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: 0,
				},
			],
			callback: (action) => {
				this.sendCommand(`main_a_row`, `${action.options.source}`)
			},
		},
		source_to_v: {
			name: 'Set source to M/E',
			options: [
				{
					label: 'Destination',
					type: 'dropdown',
					id: 'destination',
					choices: this.meDestinations,
					default: 'v1_a_row',
				},
				{
					label: 'Sources',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: 0,
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.destination}`, `${action.options.source}`)
			},
		},
		source_to_dsk: {
			name: 'Set source to DSK',
			options: [
				{
					label: 'Destination',
					type: 'dropdown',
					id: 'destination',
					choices: this.dskDestinations,
					default: 'v1_dsk1',
				},
				{
					label: 'Sources',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: 0,
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.dskDestinations}`, `${action.options.source}`)
			},
		},
		media_target: {
			name: 'Media options',
			options: [
				{
					label: 'Target',
					type: 'dropdown',
					id: 'target',
					choices: this.mediaTargets,
					default: 'ddr1_play',
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.target}`)
			},
		},
		autoplay_mode_toggle: {
			name: 'Autoplay mode',
			options: [
				{
					label: 'Target',
					type: 'dropdown',
					id: 'target',
					choices: [
						{ id: 'ddr1', label: 'DDR 1' },
						{ id: 'ddr2', label: 'DDR 2' },
						{ id: 'ddr3', label: 'DDR 3' },
						{ id: 'ddr4', label: 'DDR 4' },
					],
					default: 'ddr1',
				},
				{
					label: 'On/Off',
					type: 'dropdown',
					id: 'toggle',
					choices: [
						{ id: 'true', label: 'On' },
						{ id: 'false', label: 'Off' },
					],
					default: 'true',
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.target}_autoplay_mode_toggle`, `${action.options.toggle}`)
			},
		},
		datalink: {
			name: 'Set DataLink key value',
			options: [
				{
					label: 'DataLink Key',
					type: 'textinput',
					id: 'datalink_key',
					width: 6,
				},
				{
					label: 'DataLink Value',
					type: 'textinput',
					id: 'datalink_value',
					width: 6,
				},
			],
			callback: (action) => {
				//FIX
				let cmd = `<shortcuts><shortcut name="set_datalink"><entry key="datalink_key" value="${opt.datalink_key}" /><entry key="datalink_value" value="${opt.datalink_value}"/></shortcut></shortcuts>`
				this.sendCommand(`set_datalink`, `${action.options.toggle}`)
			},
		},
		audio_volume: {
			name: 'Set volume',
			options: [
				{
					label: 'Choice',
					type: 'dropdown',
					id: 'source',
					choices: [
						{ id: 'ddr1', label: 'DDR 1' },
						{ id: 'ddr2', label: 'DDR 2' },
						{ id: 'ddr3', label: 'DDR 3' },
						{ id: 'ddr4', label: 'DDR 4' },
						{ id: 'sound', label: 'Sound' },
						{ id: 'effects', label: 'Effects' },
					],
					default: 'ddr1',
				},
				{
					label: 'Volume (negative)',
					type: 'number',
					id: 'volume',
					default: -50,
					min: -100,
					max: 0,
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="${opt.source}_volume" value="${opt.volume}" /></shortcuts>`
			},
		},
		audio_mute: {
			name: 'Mute audio',
			options: [
				{
					label: 'Choice',
					type: 'dropdown',
					id: 'source',
					choices: [
						{ id: 'ddr1', label: 'DDR 1' },
						{ id: 'ddr2', label: 'DDR 2' },
						{ id: 'ddr3', label: 'DDR 3' },
						{ id: 'ddr4', label: 'DDR 4' },
						{ id: 'sound', label: 'Sound' },
						{ id: 'effects', label: 'Effects' },
					],
					default: 'ddr1',
				},
				{
					label: 'Mute on/off',
					type: 'dropdown',
					id: 'mute',
					choices: [
						{ id: 'true', label: 'Mute' },
						{ id: 'false', label: 'Unmute' },
					],
					default: 'true',
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="${opt.source}_mute" value="${opt.mute}" /></shortcuts>`
			},
		},
		load_save_v: {
			name: 'Load/Save Preset V',
			options: [
				{
					label: 'Select V',
					type: 'dropdown',
					id: 'v',
					choices: this.meList,
					default: 'v1',
				},
				{
					label: 'Load/Save',
					type: 'dropdown',
					id: 'loadSave',
					choices: [
						{ id: '_save_to_emem', label: 'Save to Emem' },
						{ id: '_load_from_emem', label: 'Load from Emem' },
					],
					default: '_load_from_emem',
				},
				{
					label: 'Preset number',
					type: 'number',
					id: 'preset',
					min: 0,
					max: 100,
					default: 0,
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="${opt.v}${opt.loadSave}" value="${opt.preset}" /></shortcuts>`
			},
		},
		transition_speed_number: {
			name: 'Transition Speed (number 1-10)',
			options: [
				{
					label: 'Speed',
					type: 'number',
					id: 'speed',
					min: 0,
					max: 10,
					default: 1,
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="main_background_speed" value="${opt.speed}" /></shortcuts>`
			},
		},
		transition_speed: {
			name: 'Transition Speed',
			options: [
				{
					label: 'Speed',
					type: 'dropdown',
					id: 'speed',
					choices: [
						{ id: 'main_background_medium', label: 'Medium' },
						{ id: 'main_background_slow', label: 'Slow' },
						{ id: 'main_background_fast', label: 'Fast' },
					],
					default: 'main_background_medium',
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="${opt.speed}" /></shortcuts>`
			},
		},
		transition_index: {
			name: 'Transition Type',
			options: [
				{
					label: 'Type',
					type: 'dropdown',
					id: 'type',
					choices: [
						{ id: '-1', label: '-1' },
						{ id: '0', label: '0' },
						{ id: '1', label: '1' },
						{ id: '2', label: '2' },
						{ id: '3', label: '3' },
						{ id: '4', label: '4' },
						{ id: '5', label: '5' },
						{ id: '6', label: '6' },
						{ id: '7', label: '7' },
					],
					default: '1',
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="main_background_select_index" value="${opt.type}" /></shortcuts>`
			},
		},
		previz_dsk_auto: {
			name: 'Previz DSK Auto transition',
			options: [
				{
					label: 'Choose dsk',
					type: 'dropdown',
					choices: [
						{ id: 'dsk1', label: 'DSK 1' },
						{ id: 'dsk2', label: 'DSK 2' },
						{ id: 'dsk3', label: 'DSK 3' },
						{ id: 'dsk4', label: 'DSK 4' },
					],
					id: 'dsk',
					default: 'dsk1',
				},
			],
			callback: (action) => {
				cmd = `<shortcuts><shortcut name="previz_${opt.dsk}_auto" /></shortcuts>`
			},
		},
		custom: {
			name: 'Custom shortcut',
			options: [
				{
					label: 'Command',
					type: 'textinput',
					id: 'custom',
					default: '<shortcuts><shortcut name="main_background_take" /></shortcuts>',
				},
			],
			callback: (action) => {
				cmd = opt.custom
			},
		},
	}
}
