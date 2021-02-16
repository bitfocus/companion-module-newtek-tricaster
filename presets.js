exports.getPresets = function () {
	let presets = []
	const foregroundColor = this.rgb(255, 255, 255)
	const backgroundColor = this.rgb(0, 0, 0)
	// create presets for all buttons
	this.inputs.forEach(element => {
		/** 
		 * Source on PGM
		 */
		presets.push({
			category: 'Source on PGM',
			label: element.label,
			bank: {
				style: 'text',
				text: element.label,
				size: '14',
				color: foregroundColor,
				bgcolor: backgroundColor
			},
			feedbacks: [
				{
					type: 'tally_PGM',
					options: {
						bg: this.rgb(255, 0, 0),
						fg: this.rgb(0, 0, 0),
						src: element.id
					},
				},
			],
			actions: [{
				action: 'source_pgm',
				options: {
					source: element.id
				}
			}]
		})
		/** 
		 * Source on PVW
		 */
		presets.push({
			category: 'Source on PVW',
			label: element.label,
			bank: {
				style: 'text',
				text: element.label,
				size: '14',
				color: foregroundColor,
				bgcolor: backgroundColor
			},
			feedbacks: [
				{
					type: 'tally_PVW',
					options: {
						bg: this.rgb(255, 255, 0),
						fg: this.rgb(0, 0, 0),
						src: element.id
					},
				},
			],
			actions: [{
				action: 'source_pvw',
				options: {
					source: element.id
				}
			}]
		})
		/** 
		 * Source on ME/1
		 */
		presets.push({
			category: 'Source on ME/1',
			label: element.label,
			bank: {
				style: 'text',
				text: element.label,
				size: '14',
				color: foregroundColor,
				bgcolor: backgroundColor
			},
			feedbacks: [
				{
					type: 'tally_ME1',
					options: {
						bg: this.rgb(255, 255, 0),
						fg: this.rgb(0, 0, 0),
						src: element.id
					},
				},
			],
			actions: [{
				action: 'source_v1_a_row',
				options: {
					source: element.id
				}
			}]
		})
	});
	

	return presets
}