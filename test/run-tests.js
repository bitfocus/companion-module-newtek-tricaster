import assert from 'node:assert/strict'
import { parseTimecode, parseShortcutStates, parsePlaylist, formatTime, MediaTimer } from '../src/media-timer.js'
import { createMock } from './mock-tc1.js'

let passed = 0
const cleanups = []
const test = async (name, fn) => {
	if (process.env.TRACE) console.log(`  … ${name}`)
	try {
		await fn()
		passed++
		console.log(`  ✔ ${name}`)
	} catch (e) {
		console.log(`  ✘ ${name}\n    ${e.stack}`)
		process.exitCode = 1
	} finally {
		while (cleanups.length) await cleanups.pop()()
	}
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- Real TC1 replies (curl) ---
const REAL_TC = `<timecode>
  <ddr2 clip_seconds_elapsed="0" clip_seconds_remaining="5" clip_embedded_timecode="0" clip_in="0" clip_out="5" file_duration="5" play_speed="1" clip_framerate="50" playlist_seconds_elapsed="0" playlist_seconds_remaining="15" preset_index="0" clip_index="0" num_clips="3" />
  <ddr1 clip_seconds_elapsed="174.36" clip_seconds_remaining="35825.64" clip_embedded_timecode="174.36" clip_in="0" clip_out="36000" file_duration="36000" play_speed="1" clip_framerate="25" playlist_seconds_elapsed="174.38" playlist_seconds_remaining="35825.62" preset_index="0" clip_index="29" num_clips="30" />
  <sound clip_seconds_elapsed="6.368461" clip_seconds_remaining="28.32" clip_embedded_timecode="9.56" clip_in="3.191539" clip_out="37.88" file_duration="252.78345" play_speed="1" clip_framerate="25" playlist_seconds_elapsed="6.38" playlist_seconds_remaining="28.3" preset_index="0" clip_index="8" num_clips="9" />
</timecode>`

const REAL_SS = `<shortcut_states>
  <shortcut_state name="ddr1_autoplay_mode_toggle" value="true" type="bool" sender="unknown" />
  <shortcut_state name="ddr1_comment" value="Enter a Comment for DDR 1" type="" sender="unknown" />
  <shortcut_state name="ddr1_loop_mode_toggle" value="false" type="bool" sender="unknown" />
  <shortcut_state name="ddr1_play" value="false" type="bool" sender="unknown" />
  <shortcut_state name="ddr1_short_name" value="DDR 1" type="" sender="unknown" />
  <shortcut_state name="ddr1_stop" value="true" type="bool" sender="unknown" />
  <shortcut_state name="program_tally" value="DDR1|GFX2" type="" sender="unknown" />
  <shortcut_state name="ddr1_volume" value="0" type="float" sender="unknown" />
</shortcut_states>`

console.log('Parser')
await test('ddr_timecode: channels and values', () => {
	const tc = parseTimecode(REAL_TC)
	assert.deepEqual(Object.keys(tc), ['ddr2', 'ddr1', 'sound'])
	assert.equal(tc.ddr1.remaining, 35825.64)
	assert.equal(tc.ddr1.clipIndex, 29)
	assert.equal(tc.ddr2.plRemaining, 15)
})
await test('trimmed clip: duration = out − in, not file_duration', () => {
	const s = parseTimecode(REAL_TC).sound
	assert.ok(Math.abs(s.duration - 34.688461) < 1e-6)
	assert.equal(s.fileDuration, 252.78345)
	assert.ok(Math.abs(s.clipOut - s.position - s.remaining) < 0.01) // 37.88 − 9.56 = 28.32
})
await test('shortcut_states: relevant entries only', () => {
	const ss = parseShortcutStates(REAL_SS)
	assert.equal(ss.ddr1_play, 'false')
	assert.equal(ss.ddr1_autoplay_mode_toggle, 'true')
	assert.equal(ss.program_tally, 'DDR1|GFX2')
	assert.equal(ss.ddr1_comment, undefined)
	assert.equal(ss.ddr1_volume, undefined)
})
await test('shortcut_states: 440 KB in < 20 ms', async () => {
	const mock = await createMock({ port: 8091 })
	const xml = await (await fetch('http://127.0.0.1:8091/v1/dictionary?key=shortcut_states')).text()
	await mock.close()
	const t0 = performance.now()
	for (let i = 0; i < 10; i++) parseShortcutStates(xml)
	const ms = (performance.now() - t0) / 10
	console.log(`    (${(xml.length / 1024).toFixed(0)} KB, ${ms.toFixed(1)} ms per parse)`)
	assert.ok(ms < 20)
})
await test('ddr_playlist: clip names, single clip, entities', async () => {
	const mock = await createMock({ port: 8092 })
	const xml = await (await fetch('http://127.0.0.1:8092/v1/dictionary?key=ddr_playlist')).text()
	await mock.close()
	const pl = parsePlaylist(xml)
	assert.equal(pl.ddr1.clips[29].name, 'Clouds 1080')
	assert.equal(pl.ddr1.currentClip, 29)
	assert.equal(pl.gfx2.clips.length, 1)
	assert.equal(pl.gfx2.clips[0].name, 'SO Logo & Key')
	assert.equal(pl.ddr2.shortName, 'DDR 2')
})

console.log('Formatting')
await test('countdown rounds up, elapsed rounds down', () => {
	assert.equal(formatTime(28.32, 'auto', 25, true), '0:29')
	assert.equal(formatTime(0.04, 'auto', 25, true), '0:01')
	assert.equal(formatTime(0, 'auto', 25, true), '0:00')
	assert.equal(formatTime(10.0, 'auto', 25, true), '0:10')
	assert.equal(formatTime(6.368461, 'auto', 25, false), '0:06')
	assert.equal(formatTime(35825.64, 'auto', 25, true), '9:57:06')
	assert.equal(formatTime(35825.64, 'hms', 25, true), '09:57:06')
	assert.equal(formatTime(28.32, 'tc', 25, true), '00:00:28:08')
	assert.equal(formatTime(28.32, 'sec', 25, true), '29')
})

console.log('Integration against mock TC1')
await test('remaining time, interpolation, state, clip name, stop detection', async () => {
	const mock = await createMock({ port: 8093 })
	const vars = {}
	const mt = new MediaTimer({ onVariables: (v) => Object.assign(vars, v) })
	cleanups.push(
		() => mock.close(),
		() => mt.stop(),
	)
	mt.configure({ host: '127.0.0.1:8093', tcInterval: 250, ssInterval: 1000 })
	mt.start()
	await sleep(1500)

	assert.equal(vars.ddr1_running, true, 'ddr1 running')
	assert.equal(vars.ddr2_running, false, 'ddr2 stopped')
	assert.equal(vars.ddr1_clip_name, 'Clouds 1080')
	assert.equal(vars.ddr1_clip_pos, '30/30')
	assert.equal(vars.ddr1_on_air, true)
	assert.equal(vars.gfx2_on_air, true)
	assert.equal(vars.sound_on_air, false)
	assert.equal(vars.ddr1_autoplay, true)
	assert.equal(vars.sound_duration, '0:35')

	// interpolation: deviation from "truth" < 0.15 s
	const truth = 36000 - (174.36 + (Date.now() - mock.state.ddr1.startAt) / 1000)
	const est = mt.remaining('ddr1')
	console.log(`    interpolation: deviation ${(Math.abs(truth - est) * 1000).toFixed(0)} ms`)
	assert.ok(Math.abs(truth - est) < 0.15)

	// stop → running=false within ~1 s, remaining time freezes (no WebSocket, motion detection only)
	mt.cfg.ssInterval = 60000
	await fetch('http://127.0.0.1:8093/v1/shortcut?name=ddr1_stop')
	const tStop = Date.now()
	while (vars.ddr1_running !== false && Date.now() - tStop < 3000) await sleep(50)
	console.log(`    stop detected after ${Date.now() - tStop} ms`)
	assert.equal(vars.ddr1_running, false)
	const frozen = mt.remaining('ddr1')
	await sleep(600)
	assert.equal(mt.remaining('ddr1'), frozen)
	// stop via shortcut_states (as after a notification) → immediate
	await fetch('http://127.0.0.1:8093/v1/shortcut?name=ddr1_play')
	await sleep(1000)
	mt.refreshShortcutStates()
	await sleep(300)
	assert.equal(vars.ddr1_running, true)
	await fetch('http://127.0.0.1:8093/v1/shortcut?name=ddr1_stop')
	const tStop2 = Date.now()
	mt.refreshShortcutStates()
	while (vars.ddr1_running !== false && Date.now() - tStop2 < 3000) await sleep(20)
	console.log(`    stop via shortcut_states detected after ${Date.now() - tStop2} ms`)
	assert.ok(Date.now() - tStop2 < 400)
	// "running" must not flicker back after the stop
	let flicker = false
	const tChk = Date.now()
	while (Date.now() - tChk < 1000) {
		if (vars.ddr1_running) flicker = true
		await sleep(20)
	}
	assert.equal(flicker, false, 'no flicker after stop')
	// play is detected again
	await fetch('http://127.0.0.1:8093/v1/shortcut?name=ddr1_play')
	const tPlay = Date.now()
	while (vars.ddr1_running !== true && Date.now() - tPlay < 3000) await sleep(20)
	console.log(`    play (motion only) detected after ${Date.now() - tPlay} ms`)
	assert.equal(vars.ddr1_running, true)
})

await test('hiccup (2 s reply): timeout, display keeps counting', async () => {
	const mock = await createMock({ port: 8094, hiccupEvery: 6 })
	const vars = {}
	const samples = []
	const mt = new MediaTimer({ onVariables: (v) => Object.assign(vars, v) })
	cleanups.push(
		() => mock.close(),
		() => mt.stop(),
	)
	mt.configure({ host: '127.0.0.1:8094', tcInterval: 250, ssInterval: 0 })
	mt.start()
	await sleep(1000)
	const t0 = Date.now()
	while (Date.now() - t0 < 4000) {
		const truth = 37.88 - 3.191539 - (6.368461 + (Date.now() - mock.state.sound.startAt) / 1000)
		samples.push(Math.abs(truth - mt.remaining('sound')))
		await sleep(50)
	}
	const maxErr = Math.max(...samples)
	console.log(`    max. deviation despite hiccups: ${(maxErr * 1000).toFixed(0)} ms, Timeouts: ${mt.stats.tcFail}`)
	assert.ok(maxErr < 0.2)
	assert.equal(vars.sound_running, true)
})

console.log(`\n${passed} tests passed${process.exitCode ? ' – FAILURES' : ''}`)
