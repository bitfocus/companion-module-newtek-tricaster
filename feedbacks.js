const { resolve } = require('app-root-path')

exports.initFeedbacks = function () {
	const feedbacks = {}

	const feedbackColorPreview = {
		color: this.rgb(255, 255, 255),
		bgcolor: this.rgb(0, 255, 0),
	}

	const feedbackColorProgram = {
		color: this.rgb(255, 255, 255),
		bgcolor: this.rgb(255, 0, 0),
	}

	feedbacks.tally_PGM = {
		type: 'boolean',
		label: 'Change style from program source',
		description: 'When source is on-air, button style will change',
		style: feedbackColorProgram,
		options: [
			{
				type: 'dropdown',
				label: 'source',
				id: 'src',
				choices: this.inputs,
				default: 0,
			},
		],
	}

	feedbacks.tally_PVW = {
		type: 'boolean',
		label: 'Change style from preview source',
		description: 'When source is on preview bus, button style will change',
		style: feedbackColorPreview,
		options: [
			{
				type: 'dropdown',
				label: 'source',
				id: 'src',
				choices: this.inputs,
				default: 0,
			},
		],
	}

	feedbacks.tally_record = {
		type: 'boolean',
		label: 'Change style when recording',
		description: 'When recording, button style will change',
		style: feedbackColorProgram,
	}

	feedbacks.tally_streaming = {
		type: 'boolean',
		label: 'Change style when streaming',
		description: 'When streaming, button style will change',
		style: feedbackColorProgram,
	}

	feedbacks.play_media = {
		type: 'boolean',
		label: 'Change style when player is active',
		description: 'When media state is on play, button style will change',
		style: feedbackColorProgram,
		options: [
			{
				type: 'dropdown',
				label: 'target',
				id: 'target',
				choices: this.mediaTargets,
				default: 'ddr1',
			},
		],
	}

	return feedbacks
}

exports.executeFeedback = function (feedback, bank) {
	if (feedback.type === 'tally_PGM') {
		if (this.tallyPGM[feedback.options.src] == 'true') {
			return true
		}
	}

	if (feedback.type === 'tally_PVW') {
		if (this.tallyPVW[feedback.options.src] == 'true') {
			return true
		}
	}

	if (feedback.type === 'tally_record') {
		if (this.switcher['recording']) {
			return true
		}
	}

	if (feedback.type === 'tally_streaming') {
		if (this.switcher['streaming']) {
			return true
		}
	}

	if (feedback.type === 'play_media') {
		if (this.shortcut_states[feedback.options.target] == 'true') {
			return true
		}
	}

	return false
}
