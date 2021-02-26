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

	feedbacks.tally_record = {
		label: 'Change color when recording',
		description: 'When recording, background color will change',
		options: [
			foregroundColor,
			backgroundColorProgram
		]
	};
	
	feedbacks.tally_streaming = {
		label: 'Change color when streaming',
		description: 'When streaming, background color will change',
		options: [
			foregroundColor,
			backgroundColorProgram
		]
	};

	feedbacks.play_media = {
		label: 'Change color when player is active',
		description: 'When media state is on play, background color will change',
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
		if(this.tallyPGM[feedback.options.src] == 'true') {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'tally_PVW') {
		if(this.tallyPVW[feedback.options.src] == 'true') {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}

	if(feedback.type === 'tally_record') {
		if(this.switcher['recording']) {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}
	
	if(feedback.type === 'tally_streaming') {
		if(this.switcher['streaming']) {
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