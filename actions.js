module.exports = {

	getActions() {
		var actions = {}

		actions['take'] = {	label: 'Take'	}

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

		actions['source_v1_a_row'] = {
			label: 'Set source to ME/1 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v2_a_row'] = {
			label: 'Set source to ME/2 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v3_a_row'] = {
			label: 'Set source to ME/3 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v4_a_row'] = {
			label: 'Set source to ME/4 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v5_a_row'] = {
			label: 'Set source to ME/5 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v6_a_row'] = {
			label: 'Set source to ME/6 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v7_a_row'] = {
			label: 'Set source to ME/7 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
			}]
		}
		actions['source_v8_a_row'] = {
			label: 'Set source to ME/8 PGM',
			options: [{
				label: 'Sources',
				type: 'dropdown',
				id: 'source',
				choices: this.inputs,
				default: 0
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

