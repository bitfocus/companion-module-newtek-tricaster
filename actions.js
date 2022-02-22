module.exports = {
	getActions() {
		var actions = {}

		actions['take'] = { label: 'Take' }
		actions['auto'] = { label: 'Auto transition' }
		actions['auto_dsk'] = {
			label: 'Auto transition DSK',
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
		}
		actions['record_start'] = { label: 'Record Start' }
		actions['record_stop'] = { label: 'Record Stop' }
		actions['streaming'] = {
			label: 'Streaming',
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
		}
		actions['trigger'] = {
			label: 'Trigger Custom Macro',
			options: [
				{
					label: 'Macro Name',
					type: 'dropdown',
					choices: this.custom_macros,
					id: 'macro',
					default: this.custom_macros[0] ? this.custom_macros[0].id : 'Macro Name',
				},
			],
		}
		actions['macros'] = {
			label: 'Run system macro',
			options: [
				{
					label: 'Select macro',
					type: 'dropdown',
					id: 'macro',
					choices: this.system_macros,
					default: 'Stream: Start',
				},
			],
		}
		actions['source_pvw'] = {
			label: 'Set source to preview',
			options: [
				{
					label: 'Sources',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: 0,
				},
			],
		}
		actions['source_pgm'] = {
			label: 'Set source to program',
			options: [
				{
					label: 'Sources',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: 0,
				},
			],
		}
		actions['source_to_v'] = {
			label: 'Set source to M/E',
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
		}
		actions['source_to_dsk'] = {
			label: 'Set source to DSK',
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
		}
		actions['media_target'] = {
			label: 'Media options',
			options: [
				{
					label: 'Target',
					type: 'dropdown',
					id: 'target',
					choices: this.mediaTargets,
					default: 'ddr1_play',
				},
			],
		}
		actions['autoplay_mode_toggle'] = {
			label: 'Autoplay mode',
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
		}
		actions['datalink'] = {
			label: 'Set DataLink key value',
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
		}
		actions['audio_volume'] = {
			label: 'Set volume',
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
		}
		actions['audio_mute'] = {
			label: 'Mute audio',
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
		}
		actions['load_save_v'] = {
			label: 'Load/Save Preset V',
			options: [
				{
					label: 'Select V',
					type: 'dropdown',
					id: 'v',
					choices: [
						{ id: 'v1', label: 'v1' },
						{ id: 'v2', label: 'v2' },
						{ id: 'v3', label: 'v3' },
						{ id: 'v4', label: 'v4' },
						{ id: 'v5', label: 'v5' },
						{ id: 'v6', label: 'v6' },
						{ id: 'v7', label: 'v7' },
						{ id: 'v8', label: 'v8' },
					],
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
		}
		actions['transition_speed_number'] = {
			label: 'Transition Speed (number 1-10)',
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
		}
		actions['transition_speed'] = {
			label: 'Transition Speed',
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
		}
		actions['transition_index'] = {
			label: 'Transition Type',
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
		}
		actions['previz_dsk_auto'] = {
			label: 'Previz DSK Auto transition',
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
		}
		actions['custom'] = {
			label: 'Custom shortcut',
			options: [
				{
					label: 'Command',
					type: 'textinput',
					id: 'custom',
					default: '<shortcuts><shortcut name="main_background_take" /></shortcuts>',
				},
			],
		}
		return actions
	},
}
