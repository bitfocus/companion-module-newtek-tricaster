/**
 * MediaTimer – remaining time / state of the media players (DDR, GFX, Sound) of a NewTek TriCaster / TC1
 * via the LivePanel HTTP API (/v1/dictionary).
 *
 * Intentionally independent of @companion-module/base.
 *
 * Two modes:
 *   standalone (external=false) – polls all dictionaries itself
 *   external   (external=true)  – fed by the module's WebSocket change_notifications:
 *       'ddr_timecode'  → requestTimecode()      (coalesced, min. gap minTcGapMs)
 *       'state.<name>'  → mergeShortcutStates()  (single value, ~70 bytes)
 *       'tally'         → setProgramTally()
 *       'ddr_playlist'  → pollPlaylist()
 *     plus a watchdog: if no timecode arrived for watchdogMs, it is fetched once.
 *
 * Data sources (verified on a TC1):
 *   ddr_timecode     – small, fast  → remaining, elapsed, in/out, clip x/y
 *   shortcut_states  – ~440 KB      → <player>_play, loop, autoplay, program_tally
 *   ddr_playlist     – medium       → clip names
 *
 * Findings:
 *   - play_speed is the speed slider, NOT the transport state (stays 1 when stopped)
 *   - clip_seconds_elapsed counts from the in point, clip_seconds_remaining until the out point
 *   - clip duration = clip_out - clip_in (file_duration is the full file length)
 *   - replies occasionally take ~2 s → timeout + local interpolation
 */

import http from 'node:http'
import { XMLParser } from 'fast-xml-parser'

export const DEFAULT_CHANNELS = ['ddr1', 'ddr2', 'gfx1', 'gfx2', 'sound']

export const SS_RELEVANT =
	/^(?:(ddr\d+|gfx\d+|sound|stills|titles)_(play|stop|loop_mode_toggle|autoplay_mode_toggle|single_mode_toggle|playlist_mode_toggle|short_name|long_name)|program_tally|preview_tally)$/

// ---------------------------------------------------------------------------
// Helpers (exported for tests)
// ---------------------------------------------------------------------------

export function decodeXml(s) {
	if (s === undefined || s === null) return s
	return String(s)
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&amp;/g, '&')
}

function parseAttrs(str) {
	const attrs = {}
	const re = /([\w:-]+)="([^"]*)"/g
	let m
	while ((m = re.exec(str)) !== null) attrs[m[1]] = decodeXml(m[2])
	return attrs
}

const num = (v, def = 0) => {
	const n = parseFloat(v)
	return Number.isFinite(n) ? n : def
}

/** ddr_timecode → { ddr1: {...}, ddr2: {...}, ... } */
export function parseTimecode(xml) {
	const out = {}
	const re = /<(\w+)\s+([^<>]*?)\/>/g
	let m
	while ((m = re.exec(xml)) !== null) {
		const a = parseAttrs(m[2])
		if (a.clip_seconds_remaining === undefined) continue
		const clipIn = num(a.clip_in)
		const clipOut = num(a.clip_out)
		out[m[1].toLowerCase()] = {
			elapsed: num(a.clip_seconds_elapsed),
			remaining: num(a.clip_seconds_remaining),
			position: num(a.clip_embedded_timecode),
			clipIn,
			clipOut,
			duration: Math.max(0, clipOut - clipIn),
			fileDuration: num(a.file_duration),
			speed: num(a.play_speed, 1) || 1,
			fps: num(a.clip_framerate, 25) || 25,
			plElapsed: num(a.playlist_seconds_elapsed),
			plRemaining: num(a.playlist_seconds_remaining),
			presetIndex: Math.trunc(num(a.preset_index)),
			clipIndex: Math.trunc(num(a.clip_index)),
			numClips: Math.trunc(num(a.num_clips)),
		}
	}
	return out
}

/** shortcut_states (≈440 KB) → relevant entries only, regex instead of a full XML parse */
export function parseShortcutStates(xml, filter = SS_RELEVANT) {
	const out = {}
	const re = /<shortcut_state\s+([^>]*?)\/?>/g
	let m
	while ((m = re.exec(xml)) !== null) {
		const nameMatch = /\bname="([^"]*)"/.exec(m[1])
		if (!nameMatch || !filter.test(nameMatch[1])) continue
		const valueMatch = /\bvalue="([^"]*)"/.exec(m[1])
		out[nameMatch[1]] = decodeXml(valueMatch ? valueMatch[1] : '')
	}
	return out
}

const playlistParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	parseAttributeValue: false,
	isArray: (name, jpath) => name === 'clip' || (name === 'playlist' && jpath.split('.').length === 3),
})

function baseName(file) {
	if (!file) return ''
	return String(file)
		.split(/[\\/]/)
		.pop()
		.replace(/\.[^.]+$/, '')
}

/** ddr_playlist → { ddr1: { shortName, longName, currentClip, clips: [{name, length}] } } */
export function parsePlaylist(xml) {
	const out = {}
	const root = playlistParser.parse(xml)?.playlist
	if (!root || typeof root !== 'object') return out
	for (const [ch, node] of Object.entries(root)) {
		if (!node || typeof node !== 'object') continue
		const lists = node.playlist || []
		const pl =
			lists.find((p) => p.contains_playhead === 'true') || lists.find((p) => p.is_selected === 'true') || lists[0]
		const clips = (pl?.clip || []).map((c) => ({
			name: decodeXml(c.alias) || baseName(decodeXml(c.filename)),
			length: num(c.clip_length, num(c.file_length)),
		}))
		out[ch.toLowerCase()] = {
			shortName: decodeXml(node.custom_short_name) || ch.toUpperCase(),
			longName: decodeXml(node.custom_long_name) || ch.toUpperCase(),
			currentClip: Math.trunc(num(pl?.current_clip)),
			clips,
		}
	}
	return out
}

const pad = (n, l = 2) => String(n).padStart(l, '0')

/**
 * Time formatting.
 * mode: 'auto' (m:ss or h:mm:ss) | 'hms' (hh:mm:ss) | 'tc' (hh:mm:ss:ff) | 'sec' (seconds)
 * countdown=true → round UP to the full second (0:01 is shown until it really reaches 0)
 */
export function formatTime(seconds, mode = 'auto', fps = 25, countdown = false) {
	let s = Math.max(0, Number(seconds) || 0)
	if (mode === 'tc') {
		const f = Math.max(1, Math.round(fps))
		let frames = countdown ? Math.ceil(s * f - 0.001) : Math.floor(s * f + 0.001)
		const ff = frames % f
		let t = Math.floor(frames / f)
		return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(ff)}`
	}
	const t = countdown ? Math.ceil(s - 0.001) : Math.floor(s + 0.001)
	if (mode === 'sec') return String(t)
	const h = Math.floor(t / 3600)
	const mi = Math.floor(t / 60) % 60
	const se = t % 60
	if (mode === 'hms') return `${pad(h)}:${pad(mi)}:${pad(se)}`
	return h > 0 ? `${h}:${pad(mi)}:${pad(se)}` : `${mi}:${pad(se)}`
}

/** Simple HTTP GET with a hard timeout and Connection: close */
export function httpGet(url, timeoutMs = 1000) {
	return new Promise((resolve, reject) => {
		const req = http.get(url, { agent: false, headers: { Connection: 'close' } }, (res) => {
			const chunks = []
			res.on('data', (c) => chunks.push(c))
			res.on('end', () => {
				const body = Buffer.concat(chunks).toString('utf8')
				if (res.statusCode === 200) resolve(body)
				else {
					const err = new Error(`HTTP ${res.statusCode}`)
					err.status = res.statusCode
					reject(err)
				}
			})
			res.on('error', reject)
		})
		req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout after ${timeoutMs} ms`)))
		req.on('error', reject)
	})
}

// ---------------------------------------------------------------------------
// Core class
// ---------------------------------------------------------------------------

/**
 * Callbacks:
 *   log(level, msg)
 *   onVariables(obj)              – changed variable values only
 *   onFeedbacks(ids[])            – feedback IDs to re-check
 *   onChannels(channels[])        – channel list changed (definitions must be updated)
 *   onStatus(status, message)     – 'ok' | 'connecting' | 'connection_failure' | 'bad_config'
 */
export class MediaTimer {
	constructor(callbacks = {}) {
		this.cb = {
			log: () => {},
			onVariables: () => {},
			onFeedbacks: () => {},
			onChannels: () => {},
			onStatus: () => {},
			...callbacks,
		}
		this.channels = [...DEFAULT_CHANNELS]
		this.ch = {}
		for (const c of this.channels) this.ch[c] = this._emptyChannel()
		this.ss = {}
		this.lastVars = {}
		this.running = false
		this.timers = {}
		this.failCount = 0
		this.lastPhase = 0
		this.stats = { tcOk: 0, tcFail: 0, tcMaxMs: 0 }
	}

	_emptyChannel() {
		return {
			tc: null, // last ddr_timecode record
			rxAt: 0, // timestamp (ms) tc refers to
			lastMoveAt: 0, // last time elapsed changed
			moving: false, // time is running (derived from movement, with hold time)
			advancing: false, // last reply showed movement → interpolate
			suppressMotion: 0, // number of timecode replies whose movement is ignored (after stop)
			clips: [],
			shortName: '',
			longName: '',
		}
	}

	configure(cfg) {
		this.cfg = {
			host: '',
			tcInterval: 250,
			ssInterval: 1000,
			timeout: 1000,
			timeFormat: 'auto',
			stillMs: 700, // how long elapsed may stand still before "running" = false
			maxExtrapolateMs: 2000, // max. interpolation beyond the last reply
			external: false, // true = fed by notifications (see header)
			watchdogMs: 1000, // external: fetch ddr_timecode at least this often
			minTcGapMs: 100, // external: minimum gap between two ddr_timecode requests
			plInterval: 5000,
			debug: false,
			...cfg,
		}
	}

	start() {
		this.stop()
		if (this.cfg?.external) return this._startExternal()
		if (!this.cfg?.host) {
			this.cb.onStatus('bad_config', 'Missing IP or hostname')
			return
		}
		this.running = true
		this.cb.onStatus('connecting')
		this._loop(
			'tc',
			() => this.cfg.tcInterval,
			() => this.pollTimecode(),
		)
		if (this.cfg.ssInterval > 0)
			this._loop(
				'ss',
				() => this.cfg.ssInterval,
				() => this.pollShortcutStates(),
			)
		else this.pollShortcutStates()
		this._loop(
			'pl',
			() => this.cfg.plInterval,
			() => this.pollPlaylist(),
		)
		this.timers.tick = setInterval(() => this.tick(), 100)
	}

	_startExternal() {
		if (!this.cfg.host) return
		this.running = true
		this.lastTcRx = 0
		this._lastTcReq = 0
		this._tcBusy = false
		this._tcPending = false
		// Watchdog: stay up to date without notifications (clip stopped / WebSocket down)
		this._loop(
			'wd',
			() => 250,
			async () => {
				if (Date.now() - this.lastTcRx > this.cfg.watchdogMs && !this._tcBusy) await this.requestTimecode()
			},
		)
		this._loop(
			'pl',
			() => Math.max(this.cfg.plInterval, 30000),
			() => this.pollPlaylist(),
		)
		this.timers.tick = setInterval(() => this.tick(), 100)
	}

	/**
	 * Fetch ddr_timecode (for notifications): never overlapping, minimum gap minTcGapMs,
	 * triggers arriving during a running request are coalesced into one follow-up request.
	 */
	requestTimecode() {
		if (!this.running) return Promise.resolve()
		if (this._tcBusy || this.timers.tcGap) {
			this._tcPending = true
			return Promise.resolve()
		}
		const gap = this.cfg.minTcGapMs - (Date.now() - (this._lastTcReq || 0))
		if (gap > 0) {
			this.timers.tcGap = setTimeout(() => {
				delete this.timers.tcGap
				this.requestTimecode()
			}, gap)
			return Promise.resolve()
		}
		this._tcBusy = true
		this._lastTcReq = Date.now()
		return this.pollTimecode().finally(() => {
			this._tcBusy = false
			if (this._tcPending) {
				this._tcPending = false
				this.requestTimecode()
			}
		})
	}

	/** Feed single shortcut states (e.g. from dictionary?key=state.ddr1_play) */
	mergeShortcutStates(partial) {
		const rel = {}
		for (const [k, v] of Object.entries(partial)) if (SS_RELEVANT.test(k)) rel[k] = String(v)
		if (Object.keys(rel).length) this.applyShortcutStates({ ...this.ss, ...rel })
	}

	/** Names of the sources on program (e.g. ['ddr1','gfx2']) */
	setProgramTally(names) {
		const value = names.map((n) => String(n).toLowerCase()).join('|')
		if (value !== this.ss.program_tally) this.applyShortcutStates({ ...this.ss, program_tally: value })
	}

	stop() {
		this.running = false
		for (const t of Object.values(this.timers)) {
			clearTimeout(t)
			clearInterval(t)
		}
		this.timers = {}
	}

	/** Non-overlapping poll loop: next request only after the previous one finished */
	_loop(name, intervalFn, fn) {
		const run = async () => {
			if (!this.running) return
			const t0 = Date.now()
			try {
				await fn()
			} catch {
				/* errors are handled in fn */
			}
			if (!this.running) return
			const wait = Math.max(20, intervalFn() - (Date.now() - t0))
			this.timers[name] = setTimeout(run, wait)
		}
		run()
	}

	_url(key) {
		return `http://${this.cfg.host}/v1/dictionary?key=${key}`
	}

	_ok() {
		if (this.failCount !== 0 || !this.statusOk) {
			this.failCount = 0
			this.statusOk = true
			this.cb.onStatus('ok')
		}
	}

	_fail(what, err) {
		this.failCount++
		if (err?.status === 401) {
			this.statusOk = false
			this.cb.onStatus('bad_config', 'LivePanel password enabled (HTTP 401)')
		} else if (this.failCount >= 3 && this.statusOk !== false) {
			this.statusOk = false
			this.cb.onStatus('connection_failure', String(err?.message || err))
		}
		if (this.cfg.debug || this.failCount === 3) this.cb.log('debug', `${what}: ${err?.message || err}`)
	}

	// --- ddr_timecode ------------------------------------------------------

	async pollTimecode() {
		const t0 = Date.now()
		let xml
		try {
			xml = await httpGet(this._url('ddr_timecode'), this.cfg.timeout)
		} catch (e) {
			this.stats.tcFail++
			this._fail('ddr_timecode', e)
			return
		}
		const t1 = Date.now()
		this.stats.tcOk++
		this.stats.tcMaxMs = Math.max(this.stats.tcMaxMs, t1 - t0)
		if (this.cfg.debug && t1 - t0 > 500) this.cb.log('debug', `ddr_timecode slow: ${t1 - t0} ms`)
		this._ok()
		this.lastTcRx = t1
		// sample time ≈ midpoint between request and response
		this.applyTimecode(parseTimecode(xml), Math.round((t0 + t1) / 2))
	}

	applyTimecode(data, at = Date.now()) {
		let newChannel = false
		const feedbackIds = new Set()
		let clipChanged = false

		for (const [name, tc] of Object.entries(data)) {
			if (!this.ch[name]) {
				this.ch[name] = this._emptyChannel()
				this.channels.push(name)
				newChannel = true
			}
			const c = this.ch[name]
			const prev = c.tc
			if (!prev || prev.elapsed !== tc.elapsed || prev.clipIndex !== tc.clipIndex) {
				// after a stop reported by shortcut_states, do not treat the next replies
				// (still in flight / settling) as movement
				if (c.suppressMotion > 0) c.suppressMotion--
				else if (prev) c.lastMoveAt = at
			} else if (c.suppressMotion > 0) c.suppressMotion--
			if (prev && prev.clipIndex !== tc.clipIndex) clipChanged = true
			// only interpolate if the time actually moved since the last reply
			c.advancing = !!prev && c.lastMoveAt === at
			const moving = c.lastMoveAt > 0 && at - c.lastMoveAt < this.cfg.stillMs
			if (moving !== c.moving) {
				c.moving = moving
				feedbackIds.add('media_running')
				feedbackIds.add('media_remaining')
			}
			c.tc = tc
			c.rxAt = at
		}

		if (newChannel) this.cb.onChannels([...this.channels])
		if (clipChanged && !this._plInFlight) this.pollPlaylist() // update clip name right away
		if (feedbackIds.size) this.cb.onFeedbacks([...feedbackIds])
	}

	// --- shortcut_states ---------------------------------------------------

	async pollShortcutStates() {
		let xml
		try {
			xml = await httpGet(this._url('shortcut_states'), Math.max(this.cfg.timeout, 2000))
		} catch (e) {
			this._fail('shortcut_states', e)
			return
		}
		this._ok()
		this.applyShortcutStates(parseShortcutStates(xml))
	}

	applyShortcutStates(ss) {
		const changed = Object.keys(ss).some((k) => this.ss[k] !== ss[k])
		// stop reported by the TriCaster → "stopped" immediately (faster than motion detection)
		for (const name of this.channels) {
			const c = this.ch[name]
			if (this.ss[`${name}_play`] === 'true' && ss[`${name}_play`] === 'false' && c.moving) {
				c.moving = false
				c.advancing = false
				c.lastMoveAt = 0
				c.suppressMotion = 2
			} else if (ss[`${name}_play`] === 'true' && this.ss[`${name}_play`] !== 'true') {
				c.suppressMotion = 0
			}
		}
		this.ss = ss
		if (changed) this.cb.onFeedbacks(['media_playing', 'media_on_air', 'media_remaining'])
	}

	/** reload right away, e.g. after an action or notification */
	refreshShortcutStates() {
		if (this._ssInFlight) return
		this._ssInFlight = true
		this.pollShortcutStates().finally(() => (this._ssInFlight = false))
	}

	// --- ddr_playlist ------------------------------------------------------

	async pollPlaylist() {
		this._plInFlight = true
		let xml
		try {
			xml = await httpGet(this._url('ddr_playlist'), Math.max(this.cfg.timeout, 2000))
		} catch (e) {
			this._fail('ddr_playlist', e)
			return
		} finally {
			this._plInFlight = false
		}
		this.applyPlaylist(parsePlaylist(xml))
	}

	applyPlaylist(pl) {
		let newChannel = false
		for (const [name, p] of Object.entries(pl)) {
			if (!this.ch[name]) {
				this.ch[name] = this._emptyChannel()
				this.channels.push(name)
				newChannel = true
			}
			Object.assign(this.ch[name], { clips: p.clips, shortName: p.shortName, longName: p.longName })
		}
		if (newChannel) this.cb.onChannels([...this.channels])
	}

	// --- derived values ----------------------------------------------------

	/** Flags from shortcut_states for a channel */
	flags(name) {
		const b = (k) => this.ss[`${name}_${k}`] === 'true'
		const tally = (this.ss.program_tally || '').toLowerCase().split('|')
		return {
			play: b('play'),
			loop: b('loop_mode_toggle'),
			autoplay: b('autoplay_mode_toggle'),
			onAir: tally.some((t) => t === name || t.startsWith(`${name}_`)),
		}
	}

	/** Interpolated remaining time (seconds, not rounded) */
	remaining(name, playlist = false, now = Date.now()) {
		const c = this.ch[name]
		if (!c?.tc) return null
		const base = playlist ? c.tc.plRemaining : c.tc.remaining
		if (!c.moving || !c.advancing) return base
		const dt = Math.min(now - c.rxAt, this.cfg.maxExtrapolateMs) / 1000
		return Math.max(0, base - dt * c.tc.speed)
	}

	elapsed(name, now = Date.now()) {
		const c = this.ch[name]
		if (!c?.tc) return null
		if (!c.moving || !c.advancing) return c.tc.elapsed
		const dt = Math.min(now - c.rxAt, this.cfg.maxExtrapolateMs) / 1000
		return Math.min(c.tc.duration, c.tc.elapsed + dt * c.tc.speed)
	}

	/** Remaining time in whole seconds as displayed (rounded up) */
	remainingSeconds(name, playlist = false) {
		const r = this.remaining(name, playlist)
		return r === null ? null : Math.ceil(r - 0.001)
	}

	clipName(name) {
		const c = this.ch[name]
		if (!c?.tc) return ''
		return c.clips[c.tc.clipIndex]?.name ?? ''
	}

	/** Compute all variables; returns only changes */
	computeVariables() {
		const fmt = this.cfg.timeFormat
		const vars = {}
		for (const name of this.channels) {
			const c = this.ch[name]
			const tc = c.tc
			const f = this.flags(name)
			const fps = tc?.fps ?? 25
			const rem = this.remaining(name)
			vars[`${name}_remaining`] = rem === null ? '--:--' : formatTime(rem, fmt, fps, true)
			vars[`${name}_remaining_s`] = rem === null ? '' : Math.ceil(rem - 0.001)
			vars[`${name}_elapsed`] = tc ? formatTime(this.elapsed(name), fmt, fps, false) : '--:--'
			vars[`${name}_duration`] = tc ? formatTime(tc.duration, fmt, fps, true) : '--:--'
			const plRem = this.remaining(name, true)
			vars[`${name}_playlist_remaining`] = plRem === null ? '--:--' : formatTime(plRem, fmt, fps, true)
			vars[`${name}_clip_name`] = this.clipName(name)
			vars[`${name}_clip_pos`] = tc && tc.numClips > 0 ? `${tc.clipIndex + 1}/${tc.numClips}` : ''
			vars[`${name}_running`] = !!c.moving
			vars[`${name}_play`] = f.play
			vars[`${name}_loop`] = f.loop
			vars[`${name}_autoplay`] = f.autoplay
			vars[`${name}_on_air`] = f.onAir
			vars[`${name}_name`] = c.shortName || name.toUpperCase()
		}
		const diff = {}
		for (const [k, v] of Object.entries(vars)) {
			if (this.lastVars[k] !== v) diff[k] = v
		}
		this.lastVars = vars
		return diff
	}

	tick() {
		// stale data (no more replies) → do not keep counting as "running" forever
		const now = Date.now()
		for (const name of this.channels) {
			const c = this.ch[name]
			if (c.moving && now - c.rxAt > this.cfg.maxExtrapolateMs + this.cfg.stillMs) {
				c.moving = false
				c.advancing = false
				this.cb.onFeedbacks(['media_running', 'media_remaining'])
			}
		}
		const diff = this.computeVariables()
		if (Object.keys(diff).length) this.cb.onVariables(diff)

		// re-check remaining-time feedback on second change or blink phase change
		const phase = Math.floor(Date.now() / 500) % 2
		const secChanged = Object.keys(diff).some((k) => k.endsWith('_remaining_s') || k.endsWith('_on_air'))
		if (secChanged || phase !== this.lastPhase) this.cb.onFeedbacks(['media_remaining'])
		if (Object.keys(diff).some((k) => k.endsWith('_on_air'))) this.cb.onFeedbacks(['media_on_air'])
		this.lastPhase = phase
	}

	blinkPhase() {
		return Math.floor(Date.now() / 500) % 2 === 0
	}
}
