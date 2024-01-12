import { combineRgb } from '@companion-module/base'

export function getFeedbacks() {
	const feedbacks = {}

	const ColorRed = combineRgb(200, 0, 0)
	const ColorGreen = combineRgb(0, 200, 0)

	feedbacks.tally_PGM = {
		type: 'boolean',
		name: 'Change style from program source',
		description: 'When source is on-air, button style will change',
		defaultStyle: { bgcolor: ColorRed },
		options: [
			{
				type: 'dropdown',
				label: 'Source',
				id: 'src',
				choices: this.inputs,
				default: '0',
			},
		],
		callback: (feedback) => {
			let source = this.inputs.find((el) => el.id == feedback.options.src)
			if (source?.on_pgm === 'true') {
				return true
			}
		},
	}

	feedbacks.tally_PVW = {
		type: 'boolean',
		name: 'Change style from preview source',
		description: 'When source is on preview bus, button style will change',
		defaultStyle: { bgcolor: ColorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'Source',
				id: 'src',
				choices: this.inputs,
				default: '0',
			},
		],
		callback: (feedback) => {
			let source = this.inputs.find((el) => el.id == feedback.options.src)
			if (source?.on_prev === 'true') {
				return true
			}
		},
	}

	feedbacks.recording = {
		type: 'boolean',
		name: 'Change style when recording',
		description: 'When recording, button style will change',
		defaultStyle: { bgcolor: ColorRed },
		options: [],
		callback: () => {
			if (this.switcher.recording) {
				return true
			}
		},
	}

	feedbacks.streaming = {
		type: 'boolean',
		name: 'Change style when streaming',
		description: 'When streaming, button style will change',
		defaultStyle: { bgcolor: ColorRed },
		options: [],
		callback: () => {
			if (this.switcher.streaming) {
				return true
			}
		},
	}

	feedbacks.mediaPlaying = {
		type: 'boolean',
		name: 'Change style when media player is active',
		description: 'When media state is on play, button style will change',
		defaultStyle: { bgcolor: ColorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'Media Player',
				id: 'target',
				choices: this.mediaSourceNames,
				default: 'ddr1',
			},
		],
		callback: (feedback) => {
			if (this.shortcut_states[`${feedback.options.target}_play`] == 'true') {
				return true
			}
		},
	}

	feedbacks.dskOnAir = {
		type: 'boolean',
		name: 'Change style when DSK is on air',
		description: 'When DSK is on air, button style will change',
		defaultStyle: { bgcolor: ColorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'DSK',
				id: 'target',
				choices: this.dskDestinations,
				default: 'main_dsk1',
			},
		],
		callback: (feedback) => {
			return this.shortcut_states[`${feedback.options.target}_value`]
		},
	}

	return feedbacks
}
