import { combineRgb } from '@companion-module/base'

export function getPresets() {
	const ColorWhite = combineRgb(255, 255, 255)
	const ColorBlack = combineRgb(0, 0, 0)
	const ColorRed = combineRgb(200, 0, 0)
	const ColorGreen = combineRgb(0, 200, 0)
	const ColorOrange = combineRgb(255, 102, 0)

	let presets = {}

	presets.take = {
		type: 'button',
		category: 'Basic',
		name: 'TAKE',
		options: {},
		style: {
			text: 'TAKE',
			size: '14',
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		steps: [
			{
				down: [
					{
						actionId: 'take',
						options: {
							v: 'main',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets.auto = {
		type: 'button',
		category: 'Basic',
		name: 'AUTO',
		options: {},
		style: {
			text: 'AUTO',
			size: '14',
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		steps: [
			{
				down: [
					{
						actionId: 'auto',
						options: {
							v: 'main',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets.autoDsk = {
		type: 'button',
		category: 'Basic',
		name: 'AUTO DSK',
		options: {},
		style: {
			text: 'AUTO DSK1',
			size: '14',
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		steps: [
			{
				down: [
					{
						actionId: 'auto_dsk',
						options: {
							dsk: 'dsk1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets.record = {
		type: 'button',
		category: 'Basic',
		name: 'REC',
		options: {},
		style: {
			text: 'REC',
			size: '14',
			color: ColorWhite,
			bgcolor: ColorBlack,
		},
		steps: [
			{
				down: [
					{
						actionId: 'record_start',
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tally_record',
				style: {
					bgcolor: ColorRed,
					color: ColorWhite,
				},
			},
		],
	}

	presets.streamOn = {
		type: 'button',
		category: 'Basic',
		name: 'STREAM',
		options: {},
		style: {
			text: 'Stream On',
			size: '14',
			color: ColorWhite,
			bgcolor: ColorBlack,
		},
		steps: [
			{
				down: [
					{
						actionId: 'streaming',
						options: {
							force: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tally_streaming',
				style: {
					bgcolor: ColorRed,
					color: ColorWhite,
				},
			},
		],
	}

	presets.streamOff = {
		type: 'button',
		category: 'Basic',
		name: 'STREAM',
		options: {},
		style: {
			text: 'Stream Off',
			size: '14',
			color: ColorWhite,
			bgcolor: ColorBlack,
		},
		steps: [
			{
				down: [
					{
						actionId: 'streaming',
						options: {
							force: '0',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'tally_streaming',
				style: {
					bgcolor: ColorRed,
					color: ColorWhite,
				},
			},
		],
	}

	// create presets for all inputs
	this.inputs?.forEach((element) => {
		presets[`${element.label}_pgm`] = {
			type: 'button',
			category: 'Source on PGM',
			name: element.label,
			options: {},
			style: {
				text: element.label,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'source_pgm',
							options: {
								source: element.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'tally_PGM',
					options: {
						src: element.id,
					},
					style: {
						bgcolor: ColorRed,
						color: ColorWhite,
					},
				},
			],
		}

		presets[`${element.label}_pvw`] = {
			type: 'button',
			category: 'Source on PVW',
			name: element.label,
			options: {},
			style: {
				text: element.label,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'source_pvw',
							options: {
								source: element.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'tally_PVW',
					options: {
						src: element.id,
					},
					style: {
						bgcolor: ColorGreen,
						color: ColorWhite,
					},
				},
			],
		}

		presets[`${element.label}_me1`] = {
			type: 'button',
			category: 'Source on M/E 1',
			name: element.label,
			options: {},
			style: {
				text: element.label,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'source_to_v',
							options: {
								destination: 'v1_a_row',
								source: element.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	})
	this.mediaSourceNames?.forEach((source) => {
		presets[`${source.label}_togglePlay`] = {
			type: 'button',
			category: 'Media Players',
			name: `${source.label} Toggle Play`,
			options: {},
			style: {
				text: `${source.label} Toggle Play`,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'media_target',
							options: {
								target: `${source.id}_play_toggle`,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'play_media',
					options: {
						target: `${source.id}_play`,
					},
					style: {
						bgcolor: ColorGreen,
						color: ColorWhite,
					},
				},
			],
		}

		presets[`${source.label}_back`] = {
			type: 'button',
			category: 'Media Players',
			name: `${source.label} Back`,
			options: {},
			style: {
				text: `${source.label} Back`,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'media_target',
							options: {
								target: `${source.id}_back`,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`${source.label}_forward`] = {
			type: 'button',
			category: 'Media Players',
			name: `${source.label} Forward`,
			options: {},
			style: {
				text: `${source.label} Forward`,
				size: '14',
				color: ColorWhite,
				bgcolor: ColorBlack,
			},
			steps: [
				{
					down: [
						{
							actionId: 'media_target',
							options: {
								target: `${source.id}_forward`,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	})

	return presets
}
