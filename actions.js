export function getActions() {
	let transitionOptions = [
		{ id: 'none', label: 'No Change' },
		{ id: 'on', label: 'On' },
		{ id: 'off', label: 'Off' },
		{ id: 'toggle', label: 'Toggle' },
	]

	let mixOutputOptions = [
		...this.meList,
		{ id: `program_clean`, label: 'Program Clean' },
		{ id: `Preview`, label: 'Preview' },
		{ id: `Black`, label: 'Black' },
		...this.mediaSourceNames,
	]
	this.inputs.forEach((input) => {
		if (input.ndiInput) {
			mixOutputOptions.push({ id: `INPUT${Number(input.id) + 1}`, label: input.label })
		}
	})

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
		record: {
			name: 'Record actions',
			options: [
				{
					label: 'Action',
					id: 'record',
					type: 'dropdown',
					choices: [
						{ id: 'toggle', label: 'Toggle Record' },
						{ id: 1, label: 'Start Record' },
						{ id: 0, label: 'Stop Record' },
					],
					default: 'toggle',
				},
			],
			callback: (action) => {
				if (action.options.record === 'toggle') {
					this.sendCommand(`record_toggle`)
				} else {
					this.sendCommand(`record_toggle`, `${action.options.record}`)
				}
			},
		},
		stream: {
			name: 'Stream actions',
			options: [
				{
					label: 'Action',
					id: 'stream',
					type: 'dropdown',
					choices: [
						{ id: 'toggle', label: 'Toggle Stream' },
						{ id: 1, label: 'Start Stream' },
						{ id: 0, label: 'Stop Stream' },
					],
					default: 'toggle',
				},
			],
			callback: (action) => {
				if (action.options.stream === 'toggle') {
					this.sendCommand(`streaming_toggle`)
				} else {
					this.sendCommand(`streaming_toggle`, `${action.options.stream}`)
				}
			},
		},
		customMacro: {
			name: 'Run custom macro',
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
		systemMacro: {
			name: 'Run system macro',
			options: [
				{
					label: 'Macro Name',
					type: 'dropdown',
					id: 'macro',
					choices: this.system_macros,
					default: 'Stream: Start',
				},
			],
			callback: (action) => {
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
					label: 'Source',
					type: 'dropdown',
					id: 'source',
					choices: this.inputs,
					default: '0',
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
					label: 'Source',
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
			name: 'Media actions',
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
			name: 'Set DataLink value',
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
				let cmd = `datalink?key=${action.options.datalink_key}&value=${action.options.datalink_value}`
				this.sendCommand(null, null, cmd)
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
				this.sendCommand(`${action.options.source}_volume`, `${action.options.volume}`)
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
				this.sendCommand(`${action.options.source}_mute`, `${action.options.mute}`)
			},
		},
		load_save_v: {
			name: 'Load/Save M/E Preset',
			options: [
				{
					label: 'M/E',
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
					label: 'Preset Number',
					type: 'number',
					id: 'preset',
					min: 0,
					max: 100,
					default: 0,
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.v}${action.options.loadSave}`, `${action.options.preset}`)
			},
		},
		transition_speed_number: {
			name: 'Transition Speed',
			options: [
				{
					label: 'Speed (1-10)',
					type: 'number',
					id: 'speed',
					min: 0,
					max: 10,
					default: 1,
				},
			],
			callback: (action) => {
				this.sendCommand(`main_background_speed`, `${action.options.speed}`)
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
				this.sendCommand(action.options.speed)
			},
		},
		transition_index: {
			name: 'Transition Type',
			options: [
				{
					label: 'Type',
					type: 'dropdown',
					id: 'type',
					choices: this.transitions,
					default: '1',
				},
			],
			callback: (action) => {
				this.sendCommand(`main_background_select_index`, `${action.options.type}`)
			},
		},
		previz_dsk_auto: {
			name: 'Previz DSK Auto transition',
			options: [
				{
					label: 'DSK',
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
				this.sendCommand(`previz_${action.options.dsk}_auto`)
			},
		},
		custom: {
			name: 'Custom shortcut',
			options: [
				{
					label: 'Command',
					type: 'textinput',
					id: 'custom',
					default: 'shortcut?name=main_background_take',
				},
			],
			callback: (action) => {
				this.sendCommand(null, null, action.options.custom)
			},
		},
		keyDelegate: {
			name: 'Set Transition Selection',
			options: [
				{
					label: 'M/E',
					type: 'dropdown',
					choices: this.meList,
					id: 'v',
					default: 'main',
				},
				{
					label: 'BKGD',
					type: 'dropdown',
					choices: transitionOptions,
					id: 'background',
					default: 'none',
				},
				{
					label: 'DSK 1',
					type: 'dropdown',
					choices: transitionOptions,
					id: 'dsk1',
					default: 'none',
				},
				{
					label: 'DSK 2',
					type: 'dropdown',
					choices: transitionOptions,
					id: 'dsk2',
					default: 'none',
				},
				{
					label: 'DSK 3',
					type: 'dropdown',
					choices: transitionOptions,
					id: 'dsk3',
					default: 'none',
				},
				{
					label: 'DSK 4',
					type: 'dropdown',
					choices: transitionOptions,
					id: 'dsk4',
					default: 'none',
				},
			],
			callback: (action) => {
				let v = action.options.v

				let current = this.shortcut_states[`${action.options.v}_delegate`]
				let updated = []

				let options = ['background', 'dsk1', 'dsk2', 'dsk3', 'dsk4']

				options.forEach((option) => {
					switch (action.options[`${option}`]) {
						case 'none':
							if (current.includes(`${v}_${option}`)) {
								updated.push(`${v}_${option}`)
							}
							break
						case 'on':
							updated.push(`${v}_${option}`)
							break
						case 'off':
							break
						case 'toggle':
							if (!current.includes(`${v}_${option}`)) {
								updated.push(`${v}_${option}`)
							}
							break
					}
				})
				let newDelegate = updated.join('|')
				this.sendCommand(`${action.options.v}_delegate`, newDelegate)
			},
		},
		setDskOnAir: {
			name: 'Set DSK On Air',
			options: [
				{
					label: 'DSK',
					type: 'dropdown',
					id: 'dsk',
					choices: this.dskDestinations,
					default: 'v1_dsk1',
				},
				{
					label: 'On Air',
					type: 'checkbox',
					id: 'status',
					default: true,
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.dsk}_value`, action.options.status === true ? '1' : '0')
			},
		},
		setMixOutput: {
			name: 'Set Mix Output',
			options: [
				{
					label: 'Mix',
					type: 'number',
					id: 'mix',
					default: 1,
					min: 1,
					max: 8,
				},
				{
					label: 'Source',
					type: 'dropdown',
					id: 'source',
					choices: mixOutputOptions,
					default: 'main',
				},
			],
			callback: (action) => {
				console.log(action.options.source)
				let source = action.options.source
				if (source === 'main') {
					source = 'Program'
				}

				console.log(action.options.source)
				this.sendCommand(`mix${action.options.mix}_output_source`, source)
			},
		},
	}
}
