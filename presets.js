exports.getPresets = function () {
	let presets = []
	const foregroundColor = this.rgb(255, 255, 255)
	const backgroundColor = this.rgb(0, 0, 0)
		
	/** 
	 * Take
	 */
	presets.push({
		category: 'Basic',
		label: 'TAKE',
		bank: {
			style: 'text',
			text: 'TAKE',
			size: '14',
			color: foregroundColor,
			bgcolor: this.rgb(255,0,0)
		},
		actions: [{
			action: 'take'
		}]
	})
	/** 
	 * Auto
	 */
	presets.push({
		category: 'Basic',
		label: 'AUTO',
		bank: {
			style: 'text',
			text: 'AUTO',
			size: '14',
			color: foregroundColor,
			bgcolor: this.rgb(255,0,0)
		},
		actions: [{
			action: 'auto'
		}]
	})
	/** 
	 * Record
	 */
	presets.push({
		category: 'Basic',
		label: 'REC',
		bank: {
			style: 'text',
			text: 'REC',
			size: '14',
			color: foregroundColor,
			bgcolor: backgroundColor
		},
		feedbacks: [
			{
				type: 'tally_record',
				options: {
					bg: this.rgb(255, 0, 0),
					fg: this.rgb(255, 255, 255),
				},
			},
		],
		actions: [{
			action: 'record_start'
		}],
		release_actions: [{
			action: 'record_stop'
		}]
	})
	/** 
	 * Stream
	 */
	presets.push({
		category: 'Basic',
		label: 'STREAM',
		bank: {
			style: 'text',
			text: 'Stream on',
			size: '14',
			color: foregroundColor,
			bgcolor: backgroundColor
		},
		feedbacks: [
			{
				type: 'tally_streaming',
				options: {
					bg: this.rgb(255, 0, 0),
					fg: this.rgb(255, 255, 255),
				},
			},
		],
		actions: [{
			action: 'streaming',
			options: {
				force: "1"
			}
		}]
	})
	presets.push({
		category: 'Basic',
		label: 'STREAM',
		bank: {
			style: 'text',
			text: 'Stream off',
			size: '14',
			color: foregroundColor,
			bgcolor: backgroundColor
		},
		feedbacks: [
			{
				type: 'tally_streaming',
				options: {
					bg: this.rgb(255, 0, 0),
					fg: this.rgb(255, 255, 255),
				},
			},
		],
		actions: [{
			action: 'streaming',
			options: {
				force: "0"
			}
		}]
	})

	// create presets for all inputs
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
			category: 'Source on V1',
			label: element.label,
			bank: {
				style: 'text',
				text: element.label,
				size: '14',
				color: foregroundColor,
				bgcolor: backgroundColor
			},
			actions: [{
				action: 'source_to_v',
				options: {
					destination: 'v1_a_row',
					source: element.id
				}
			}]
		})
	});
	


	return presets
}