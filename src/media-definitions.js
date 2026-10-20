/**
 * Variables, feedbacks, actions and presets for the media timer (DDR/GFX/Sound remaining time).
 * All functions are called with the module instance as `this` (this.mt = MediaTimer).
 */
import { combineRgb } from '@companion-module/base'

const PER_CHANNEL = [
	['remaining', 'Remaining time (clip)'],
	['remaining_s', 'Remaining time (clip, seconds)'],
	['elapsed', 'Elapsed time (clip)'],
	['duration', 'Duration (clip, in→out)'],
	['playlist_remaining', 'Remaining time (playlist)'],
	['clip_name', 'Clip name'],
	['clip_pos', 'Clip position (x/y)'],
	['running', 'Time running (true/false)'],
	['play', 'Play state from TriCaster (true/false)'],
	['loop', 'Loop enabled'],
	['autoplay', 'Autoplay enabled'],
	['on_air', 'On program (true/false)'],
	['name', 'Channel name'],
]

function channelLabel(name) {
	const c = this.mt.ch[name]
	return c?.shortName || name.toUpperCase()
}

function channelChoices() {
	return this.mt.channels.map((ch) => ({ id: ch, label: channelLabel.call(this, ch) }))
}

export function getMediaVariables() {
	if (!this.mt || this.config?.media_timer === false) return []
	const variables = []
	for (const ch of this.mt.channels) {
		const label = channelLabel.call(this, ch)
		for (const [id, name] of PER_CHANNEL) {
			variables.push({ variableId: `${ch}_${id}`, name: `${label}: ${name}` })
		}
	}
	return variables
}

export function getMediaFeedbacks() {
	if (!this.mt || this.config?.media_timer === false) return {}
	const choices = channelChoices.call(this)
	const channelOption = { type: 'dropdown', label: 'Media player', id: 'channel', choices, default: 'ddr1' }
	const white = combineRgb(255, 255, 255)

	return {
		media_remaining: {
			type: 'boolean',
			name: 'Media: Remaining time ≤ threshold',
			description: 'Active when the (rounded-up) remaining time is at most X seconds',
			defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: white },
			options: [
				channelOption,
				{ type: 'number', label: 'Threshold (s)', id: 'seconds', min: 0, max: 86400, default: 10 },
				{
					type: 'dropdown',
					label: 'Scope',
					id: 'scope',
					default: 'clip',
					choices: [
						{ id: 'clip', label: 'Current clip' },
						{ id: 'playlist', label: 'Whole playlist (autoplay)' },
					],
				},
				{ type: 'checkbox', label: 'Only while time is running', id: 'only_running', default: true },
				{ type: 'checkbox', label: 'Only when on program', id: 'only_on_air', default: false },
				{ type: 'checkbox', label: 'Not when loop is enabled', id: 'skip_loop', default: true },
				{ type: 'checkbox', label: 'Blink', id: 'blink', default: false },
			],
			callback: (fb) => {
				const o = fb.options
				const ch = this.mt.ch[o.channel]
				if (!ch?.tc) return false
				const f = this.mt.flags(o.channel)
				if (o.only_running && !ch.moving) return false
				if (o.only_on_air && !f.onAir) return false
				if (o.skip_loop && f.loop) return false
				const s = this.mt.remainingSeconds(o.channel, o.scope === 'playlist')
				if (s === null || s > Number(o.seconds)) return false
				return o.blink ? this.mt.blinkPhase() : true
			},
		},
		media_running: {
			type: 'boolean',
			name: 'Media: Time running',
			description: 'Active while the clip time is advancing',
			defaultStyle: { bgcolor: combineRgb(0, 150, 0), color: white },
			options: [channelOption],
			callback: (fb) => !!this.mt.ch[fb.options.channel]?.moving,
		},
		media_playing: {
			type: 'boolean',
			name: 'Media: Play state (TriCaster)',
			description: 'State of the <player>_play shortcut',
			defaultStyle: { bgcolor: combineRgb(0, 150, 0), color: white },
			options: [channelOption],
			callback: (fb) => this.mt.flags(fb.options.channel).play,
		},
		media_on_air: {
			type: 'boolean',
			name: 'Media: Player on program',
			description: 'Media player is on program (tally)',
			defaultStyle: { bgcolor: combineRgb(200, 0, 0), color: white },
			options: [channelOption],
			callback: (fb) => this.mt.flags(fb.options.channel).onAir,
		},
	}
}

export function getMediaActions() {
	if (!this.mt || this.config?.media_timer === false) return {}
	const choices = channelChoices.call(this)
	return {
		media_transport: {
			name: 'Media: Transport',
			options: [
				{ type: 'dropdown', label: 'Media player', id: 'channel', choices, default: 'ddr1' },
				{
					type: 'dropdown',
					label: 'Command',
					id: 'cmd',
					default: 'play_toggle',
					choices: [
						{ id: 'play', label: 'Play' },
						{ id: 'play_toggle', label: 'Play/Stop toggle' },
						{ id: 'stop', label: 'Stop' },
						{ id: 'back', label: 'Back (previous clip)' },
						{ id: 'forward', label: 'Forward (next clip)' },
						{ id: 'loop_mode_toggle', label: 'Toggle loop' },
						{ id: 'autoplay_mode_toggle', label: 'Toggle autoplay' },
					],
				},
			],
			callback: (action) => {
				this.sendCommand(`${action.options.channel}_${action.options.cmd}`)
			},
		},
	}
}

export function getMediaPresets() {
	if (!this.mt || this.config?.media_timer === false) return {}
	const white = combineRgb(255, 255, 255)
	const black = combineRgb(0, 0, 0)
	const presets = {}
	const remainingOpts = (ch, seconds, blink, scope = 'clip') => ({
		channel: ch,
		seconds,
		scope,
		only_running: true,
		only_on_air: false,
		skip_loop: true,
		blink,
	})

	for (const ch of this.mt.channels) {
		const label = channelLabel.call(this, ch)
		const v = (id) => `$(${this.label}:${ch}_${id})`

		presets[`media_${ch}_countdown`] = {
			type: 'button',
			category: 'Media Timer',
			name: `${label} countdown`,
			style: { text: `${label}\\n${v('remaining')}`, size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'media_transport', options: { channel: ch, cmd: 'play_toggle' } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'media_running',
					options: { channel: ch },
					style: { bgcolor: combineRgb(0, 110, 0), color: white },
				},
				{
					feedbackId: 'media_remaining',
					options: remainingOpts(ch, 30, false),
					style: { bgcolor: combineRgb(255, 170, 0), color: black },
				},
				{
					feedbackId: 'media_remaining',
					options: remainingOpts(ch, 10, true),
					style: { bgcolor: combineRgb(220, 0, 0), color: white },
				},
			],
		}
		presets[`media_${ch}_info`] = {
			type: 'button',
			category: 'Media Timer',
			name: `${label} clip info`,
			style: {
				text: `${v('clip_pos')} ${v('clip_name')}\\n${v('elapsed')}/${v('duration')}`,
				size: '7',
				color: white,
				bgcolor: black,
			},
			steps: [],
			feedbacks: [
				{
					feedbackId: 'media_on_air',
					options: { channel: ch },
					style: { bgcolor: combineRgb(120, 0, 0), color: white },
				},
			],
		}
		presets[`media_${ch}_playlist`] = {
			type: 'button',
			category: 'Media Timer',
			name: `${label} playlist remaining`,
			style: { text: `${label} PL\\n${v('playlist_remaining')}`, size: '14', color: white, bgcolor: black },
			steps: [],
			feedbacks: [
				{
					feedbackId: 'media_remaining',
					options: remainingOpts(ch, 30, false, 'playlist'),
					style: { bgcolor: combineRgb(255, 170, 0), color: black },
				},
			],
		}
	}
	return presets
}
