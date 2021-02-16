const { resolve } = require("app-root-path");

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
				choices: this.inputs,
				default: 0
			}
		]
	};

	feedbacks.tally_PVW = {
		label: 'Change color from preview source',
		description: 'When source is on preview bus, background color will change',
		options: [
			foregroundColor,
			backgroundColorPreview,
			{
				type: 'dropdown',
				label: 'source',
				id: 'src',
				choices: this.inputs,
				default: 0
			}
		]
	};

	feedbacks.play_media = {
		label: 'Change color when player is active',
		description: 'When source is on preview bus, background color will change',
		options: [
			foregroundColor,
			backgroundColorPreview,
			{
				type: 'dropdown',
				label: 'target',
				id: 'target',
				choices: this.mediaTargets,
				default: 'ddr1'
			}
		]
	};

	return feedbacks;

}

exports.executeFeedback = function (feedback, bank) {
	if(feedback.type === 'tally_PGM') {
		if(feedback.options.src == this.tally['PGM']) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'tally_PVW') {
		if(feedback.options.src == this.tally['PVW']) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'play_media') {
		if(this.shortcut_states[feedback.options.target] == 'true') {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}
};