/**
 * Mock TC1 for tests without hardware, modelled on real TC1 replies and notifications.
 * Start: node test/mock-tc1.js [port]   → http://127.0.0.1:<port>/v1/...
 */
import http from 'node:http'
import { WebSocketServer } from 'ws'

export function createMock({ port = 8089, hiccupEvery = 0, notifications = true } = {}) {
	const t0 = Date.now()
	const state = {
		ddr1: { playing: true, startAt: t0, base: 174.36, clipIn: 0, clipOut: 36000, fps: 25, clipIndex: 29, numClips: 30 },
		ddr2: { playing: false, startAt: t0, base: 0, clipIn: 0, clipOut: 5, fps: 50, clipIndex: 0, numClips: 3 },
		gfx2: { playing: false, startAt: t0, base: 0, clipIn: 0, clipOut: 5, fps: 50, clipIndex: 0, numClips: 3 },
		sound: {
			playing: true,
			startAt: t0,
			base: 6.368461,
			clipIn: 3.191539,
			clipOut: 37.88,
			fps: 25,
			clipIndex: 8,
			numClips: 9,
			fileDuration: 252.78345,
		},
		loop: { ddr1: false },
		autoplay: { ddr1: true },
		tally: 'DDR1|GFX2',
	}
	let reqCount = 0
	const hits = {} // requests per dictionary key (load measurement)

	const elapsedOf = (c) => {
		const e = c.playing ? c.base + (Date.now() - c.startAt) / 1000 : c.base
		const dur = c.clipOut - c.clipIn
		return Math.min(dur, Math.floor(e * c.fps) / c.fps) // frame accurate like the TC1
	}
	const r2 = (n) => Math.round(n * 100) / 100

	function timecodeXml() {
		let x = '<timecode>\n'
		for (const ch of ['ddr2', 'gfx2', 'ddr1', 'sound']) {
			const c = state[ch]
			const el = elapsedOf(c)
			const rem = c.clipOut - c.clipIn - el
			x += `  <${ch} clip_seconds_elapsed="${r2(el)}" clip_seconds_remaining="${r2(rem)}" clip_embedded_timecode="${r2(c.clipIn + el)}" clip_in="${c.clipIn}" clip_out="${c.clipOut}" file_duration="${c.fileDuration ?? c.clipOut}" play_speed="1" clip_framerate="${c.fps}" playlist_seconds_elapsed="${r2(el)}" playlist_seconds_remaining="${r2(rem)}" preset_index="0" clip_index="${c.clipIndex}" num_clips="${c.numClips}" />\n`
		}
		return x + '</timecode>'
	}

	function shortcutStatesXml() {
		let x = '<shortcut_states>\n'
		for (const ch of ['ddr1', 'ddr2', 'gfx1', 'gfx2', 'sound']) {
			const p = !!state[ch]?.playing
			x += `  <shortcut_state name="${ch}_play" value="${p}" type="bool" sender="unknown" />\n`
			x += `  <shortcut_state name="${ch}_stop" value="${!p}" type="bool" sender="unknown" />\n`
			x += `  <shortcut_state name="${ch}_loop_mode_toggle" value="${!!state.loop[ch]}" type="bool" sender="unknown" />\n`
			x += `  <shortcut_state name="${ch}_autoplay_mode_toggle" value="${!!state.autoplay[ch]}" type="bool" sender="unknown" />\n`
			x += `  <shortcut_state name="${ch}_short_name" value="${ch.toUpperCase().replace(/(\d)/, ' $1')}" type="" sender="unknown" />\n`
			x += `  <shortcut_state name="${ch}_long_name" value="${ch.toUpperCase().replace(/(\d)/, ' $1')}" type="" sender="unknown" />\n`
		}
		x += `  <shortcut_state name="input1_long_name" value="CAM 1" type="" sender="unknown" />\n`
		x += `  <shortcut_state name="input1_short_name" value="CAM1" type="" sender="unknown" />\n`
		x += `  <shortcut_state name="record_toggle" value="0" type="int" sender="unknown" />\n`
		x += `  <shortcut_state name="program_tally" value="${state.tally}" type="" sender="unknown" />\n`
		// pad to a realistic ~440 KB
		let i = 0
		while (x.length < 439000)
			x += `  <shortcut_state name="input${i % 40}_param_${i++}" value="0" type="float" sender="unknown" />\n`
		return x + '</shortcut_states>'
	}

	function playlistXml() {
		const clips = (names, fr = 25) =>
			names
				.map(
					(n, i) =>
						`      <clip alias="${n}" frame_rate="${fr}" file_length="10" filename="E:\\Sessions\\x\\${n}.mov" audio_level="0" clip_length="10" />`,
				)
				.join('\n')
		const ddr1 = Array.from({ length: 30 }, (_, i) => (i === 29 ? 'Clouds 1080' : `Clip ${i + 1}`))
		const sound = Array.from({ length: 9 }, (_, i) => (i === 8 ? 'Free Energy' : `Track ${i + 1}`))
		return `<playlist>
  <ddr2 custom_short_name="DDR 2" custom_long_name="DDR 2">
    <playlist contains_playhead="true" is_selected="true" preset_index="0" current_clip="0">
${clips(['KeyVisual_EMP', 'EMP_Thank you', 'EMP_The next Session'], 50)}
    </playlist>
  </ddr2>
  <gfx2 custom_short_name="GFX 2" custom_long_name="GFX 2">
    <playlist contains_playhead="true" is_selected="true" preset_index="0" current_clip="0">
      <clip alias="SO Logo &amp; Key" frame_rate="50" file_length="5" filename="E:\\x.png" clip_length="5" />
    </playlist>
  </gfx2>
  <sound custom_short_name="SOUND" custom_long_name="SOUND">
    <playlist contains_playhead="true" is_selected="true" preset_index="0" current_clip="8">
${clips(sound)}
    </playlist>
  </sound>
  <ddr1 custom_short_name="DDR 1" custom_long_name="DDR 1">
    <playlist contains_playhead="true" is_selected="true" preset_index="0" current_clip="29">
${clips(ddr1)}
    </playlist>
  </ddr1>
</playlist>`
	}

	function singleState(key) {
		const name = key.replace(/^state\./, '')
		const m = /^(ddr\d|gfx\d|sound)_(play|stop)$/.exec(name)
		if (!m) return ''
		const p = !!state[m[1]]?.playing
		const v = m[2] === 'play' ? p : !p
		return `<shortcut_state name="${name}" value="${v}" type="bool" sender="" />`
	}
	function tallyXml() {
		const on = state.tally.toLowerCase().split('|')
		const cols = ['input1', 'ddr1', 'ddr2', 'gfx1', 'gfx2']
		return `<tally>\n${cols.map((n, i) => `  <column index="${i}" name="${n}" on_pgm="${on.includes(n)}" on_prev="false" />`).join('\n')}\n</tally>`
	}
	const STATIC = {
		switcher_ui_effects: `<switcher_ui_effects><switcher name="main"><effect_bin index="0" effect="C:\\x\\Fade.trans" /><effect_bin index="1" effect="C:\\x\\Wipe.trans" /></switcher><switcher name="v1"><effect_bin index="0" effect="C:\\x\\Fade.trans" /></switcher></switcher_ui_effects>`,
		macros_list: `<macros><systemfolder><macro name="Sys A" /><macro name="Sys B" /></systemfolder><sessionfolder><macro name="Session A" /><macro name="Session B" /></sessionfolder></macros>`,
		switcher: `<switcher_update main_source="DDR1" preview_source="INPUT1" />`,
	}

	// like the TC1: ~9 Hz 'ddr_timecode' notifications while a player is running
	const tcTimer = setInterval(() => {
		if (notifications && ['ddr1', 'ddr2', 'gfx2', 'sound'].some((c) => state[c].playing)) notify('ddr_timecode')
	}, 110)

	const server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://x')
		const send = (body) => {
			const delay = hiccupEvery && ++reqCount % hiccupEvery === 0 ? 2000 : 0
			setTimeout(() => {
				res.writeHead(200, { 'Content-Type': 'text/xml' })
				res.end(body)
			}, delay)
		}
		if (url.pathname === '/v1/version') {
			hits.version = (hits.version || 0) + 1
			return send(
				'<product_information><product_name>TriCaster TC1</product_name><machine_name>SO-TC1-MOCK</machine_name><product_version>8-2</product_version><session_name>Stresstest</session_name></product_information>',
			)
		}
		if (url.pathname === '/v1/dictionary') {
			const key = url.searchParams.get('key')
			hits[key] = (hits[key] || 0) + 1
			if (key.startsWith('state.')) return send(singleState(key))
			if (key === 'tally') return send(tallyXml())
			if (STATIC[key]) return send(STATIC[key])
			if (key === 'ddr_timecode') return send(timecodeXml())
			if (key === 'shortcut_states') return send(shortcutStatesXml())
			if (key === 'ddr_playlist') return send(playlistXml())
		}
		if (url.pathname === '/v1/shortcut') {
			const name = url.searchParams.get('name') || ''
			const m = /^(ddr\d|gfx\d|sound)_(play|stop|play_toggle)$/.exec(name)
			if (m) {
				const c = state[m[1]]
				const want = m[2] === 'play' ? true : m[2] === 'stop' ? false : !c.playing
				if (want !== c.playing) {
					c.base = elapsedOf(c)
					c.startAt = Date.now()
					c.playing = want
					if (notifications) {
						// order as on the real TC1: state.* immediately, shortcut_states ~1 s later
						notify(`state.${m[1]}_play`)
						notify(`state.${m[1]}_stop`)
						setTimeout(() => notify('shortcut_states'), 1000)
					}
				}
			}
			res.writeHead(200)
			return res.end('')
		}
		res.writeHead(404)
		res.end()
	})

	const wss = new WebSocketServer({ noServer: true })
	server.on('upgrade', (req, sock, head) => {
		if (req.url === '/v1/change_notifications') wss.handleUpgrade(req, sock, head, (ws) => wss.emit('connection', ws))
		else sock.destroy()
	})
	function notify(key) {
		for (const c of wss.clients) c.readyState === 1 && c.send(key)
	}

	return new Promise((resolve) =>
		server.listen(port, '127.0.0.1', () =>
			resolve({
				state,
				port,
				notify,
				hits,
				setTally: (v) => {
					state.tally = v
					notify('tally')
				},
				close: () =>
					new Promise((r) => {
						clearInterval(tcTimer)
						for (const c of wss.clients) c.terminate()
						wss.close()
						server.closeAllConnections?.()
						server.close(r)
					}),
			}),
		),
	)
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const port = Number(process.argv[2]) || 8089
	createMock({ port }).then(() => console.log(`Mock TC1 listening on http://127.0.0.1:${port}/v1/`))
}
