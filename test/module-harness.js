// Runs the REAL module (index.js) with a stub base against the mock TC1 incl. WebSocket notifications.
// Usage: node --import ./test/stub/register.mjs test/module-harness.js
import assert from 'node:assert/strict'
import { createMock } from './mock-tc1.js'
await import('../index.js')
const Cls = globalThis.__ModuleClass
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 8097
const mock = await createMock({ port: PORT })
const inst = new Cls({})
let failed = 0
const check = (name, fn) => {
	try {
		fn()
		console.log(`  ✔ ${name}`)
	} catch (e) {
		failed++
		console.log(`  ✘ ${name}\n    ${e.message}`)
	}
}
const until = async (cond, ms = 3000) => {
	const t0 = Date.now()
	while (!cond() && Date.now() - t0 < ms) await sleep(10)
	return Date.now() - t0
}

try {
	await inst.init({ host: `127.0.0.1:${PORT}`, datalink: false })
	await sleep(2500)

	console.log('Start')
	check('no presets referencing missing actions', () => assert.deepEqual(inst.presetProblems, []))
	check('status only set on change (≤ 3 entries)', () =>
		assert.ok(inst.statusLog.length <= 3, JSON.stringify(inst.statusLog)),
	)
	check('existing variables still present (product_name)', () => assert.equal(inst.vars.product_name, 'TriCaster TC1'))
	check('media variables defined', () => assert.ok(inst.varDefs.some((v) => v.variableId === 'ddr1_remaining')))
	check('ddr1 running, remaining time set', () => {
		assert.equal(inst.vars.ddr1_running, true)
		assert.match(inst.vars.ddr1_remaining, /^9:5\d:\d\d$/)
	})
	check('clip name / position', () => {
		assert.equal(inst.vars.ddr1_clip_name, 'Clouds 1080')
		assert.equal(inst.vars.ddr1_clip_pos, '30/30')
	})
	check('on air from tally: ddr1 & gfx2 yes, ddr2 no', () => {
		assert.equal(inst.vars.ddr1_on_air, true)
		assert.equal(inst.vars.gfx2_on_air, true)
		assert.equal(inst.vars.ddr2_on_air, false)
	})
	check('play state from shortcut_states', () => assert.equal(inst.vars.ddr1_play, true))
	check('feedback definitions: existing + media', () => {
		assert.ok(inst.fbDefs.mediaPlaying && inst.fbDefs.media_remaining)
	})

	console.log('load during playback (3 s)')
	const h0 = { ...mock.hits }
	await sleep(3000)
	const d = (k) => (mock.hits[k] || 0) - (h0[k] || 0)
	console.log(
		`    ddr_timecode: ${d('ddr_timecode')} requests, shortcut_states: ${d('shortcut_states')}, ddr_playlist: ${d('ddr_playlist')}`,
	)
	check('ddr_timecode follows notifications (15–35 in 3 s)', () =>
		assert.ok(d('ddr_timecode') >= 15 && d('ddr_timecode') <= 35),
	)
	check('no shortcut_states polling', () => assert.equal(d('shortcut_states'), 0))

	console.log('stop via action media_transport')
	inst.actDefs.media_transport.callback({ options: { channel: 'ddr1', cmd: 'stop' } })
	const tStop = await until(() => inst.vars.ddr1_running === false && inst.vars.ddr1_play === false)
	console.log(`    stop + play state detected after ${tStop} ms`)
	check('stop detected < 400 ms (state.ddr1_play)', () => assert.ok(tStop < 400))
	check('existing feedback mediaPlaying reacts immediately', () =>
		assert.ok(!inst.fbDefs.mediaPlaying.callback({ options: { target: 'ddr1' } })),
	)
	const frozen = inst.vars.ddr1_remaining
	const h1 = { ...mock.hits }
	await sleep(2500)
	const d1 = (k) => (mock.hits[k] || 0) - (h1[k] || 0)
	console.log(
		`    while stopped (2.5 s): ddr_timecode ${d1('ddr_timecode')} requests (watchdog), shortcut_states ${d1('shortcut_states')}`,
	)
	// sound keeps playing in the mock → notifications continue; stop sound as well and measure again
	check('remaining time frozen', () => assert.equal(inst.vars.ddr1_remaining, frozen))

	inst.actDefs.media_transport.callback({ options: { channel: 'sound', cmd: 'stop' } })
	await sleep(1500)
	const h2 = { ...mock.hits }
	await sleep(3000)
	const d2 = (k) => (mock.hits[k] || 0) - (h2[k] || 0)
	console.log(`    all stopped (3 s): ddr_timecode ${d2('ddr_timecode')} requests`)
	check('watchdog ~1/s without notifications', () => assert.ok(d2('ddr_timecode') >= 2 && d2('ddr_timecode') <= 4))

	console.log('play + tally change')
	inst.actDefs.media_transport.callback({ options: { channel: 'ddr1', cmd: 'play' } })
	const tPlay = await until(() => inst.vars.ddr1_running === true)
	console.log(`    play detected after ${tPlay} ms`)
	check('play detected < 500 ms', () => assert.ok(tPlay < 500))
	mock.setTally('INPUT1')
	const tTally = await until(() => inst.vars.ddr1_on_air === false)
	console.log(`    tally change detected after ${tTally} ms`)
	check('on air follows tally notification', () => assert.equal(inst.vars.ddr1_on_air, false))
	check('status still without spam', () => assert.ok(inst.statusLog.length <= 3, JSON.stringify(inst.statusLog)))
	check('no errors in log', () =>
		assert.deepEqual(
			inst.logs.filter(([l]) => l === 'error'),
			[],
		),
	)

	console.log('TriCaster not reachable at startup (e.g. after sleep)')
	const PORT2 = 8098
	const inst2 = new Cls({})
	try {
		await inst2.init({ host: `127.0.0.1:${PORT2}`, datalink: false })
		await sleep(300)
		check('actions defined without connection (no "Unknown action")', () => assert.ok(inst2.actDefs?.take))
		check('status connection_failure', () => assert.equal(inst2.statusLog.at(-1)?.[1], 'connection_failure'))
		const mock2 = await createMock({ port: PORT2 })
		const tConn = await until(() => inst2.vars.product_name === 'TriCaster TC1', 8000)
		console.log(`    connected after TriCaster came up: ${tConn} ms`)
		check('reconnects automatically (< 6 s)', () => assert.ok(tConn < 6000))
		await sleep(1500)
		check('media timer running after late connect', () => assert.equal(inst2.vars.ddr1_running, true))
		check('only one error logged', () => assert.equal(inst2.logs.filter(([l]) => l === 'error').length, 1))
		await inst2.destroy()
		await mock2.close()
	} finally {
		await inst2.destroy()
	}
} finally {
	await inst.destroy()
	await mock.close()
}
console.log(failed ? `\n${failed} FAILED` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
