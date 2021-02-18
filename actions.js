module.exports = {

	getActions() {
		var actions = {}

		actions['take'] = {	label: 'Take'	}
		actions['auto'] = {	label: 'Auto transition'	}

		actions['macros'] = {
			label: 'Run system macro',
			options: [{
				label: 'Select macro',
				type: 'dropdown',
				id: 'macro',
				choices: this.system_macros
			}]
		}

		actions['source_pvw'] = {
			label: 'Set source to preview',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		
		actions['source_pgm'] = {
			label: 'Set source to program',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}

		actions['source_to_v'] = {
			label: 'Set source to V',
			options: [{
				label: 'Destination',
				type: 'dropdown',
				id: 'destination',
				choices: this.meDestinations,
				default: 'v1_a_row'
			},{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
	
		actions['media_target'] = {
			label: 'Media options',
			options: [{
				label: 'Target',
				type: 'dropdown',
				id: 'target',
				choices: this.mediaTargets,
				default: 'ddr1_play'
			}]
		}

		actions['custom'] = {
			label: 'Custom shortcut',
			options: [{
				label: 'Command',
				type: 'textinput',
				id: 'custom',
				default: '<shortcuts><shortcut name="main_background_take" /></shortcuts>'
			}]
		}

		return actions
	},

}

