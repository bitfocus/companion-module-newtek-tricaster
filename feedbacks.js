exports.initFeedbacks = function() {
	const feedbacks = {};

	const foregroundColor = {
		type: 'colorpicker',
		label: 'Foreground color',
		id: 'fg',
		default: this.rgb(255, 255, 255)
	};

	const backgroundColorPreview = {
		type: 'colorpicker',
		label: 'Background color',
		id: 'bg',
		default: this.rgb(0, 255, 0)
	};

	const backgroundColorProgram = {
		type: 'colorpicker',
		label: 'Background color',
		id: 'bg',
		default: this.rgb(255, 0, 0)
	};

	let sources = [];
	this.tally.tally.column.forEach(element => {
		sources.push({ id: element.index[0], label: element.name[0] });
	});

	feedbacks.tally_PGM = {
		label: 'Change color from program source',
		description: 'When source is on-air, background color will change',
		options: [
			foregroundColor,
			backgroundColorProgram,
			{
				type: 'dropdown',
				label: 'source',
				id: 'src',
				choices: sources
			}
		]
	};

	return feedbacks;

}

exports.executeFeedback = function (feedback, bank) {
	if(feedback.type === 'tally_PGM') {

		this.tally.tally.column.forEach(element => {
			if (element.index[0] == feedback.options.src && element.on_pgm[0] == 'true') {
				console.log('Feedback showing');
				return {
					color: feedback.options.fg,
					bgcolor: feedback.options.bg
				};
			}
		});
	}
};