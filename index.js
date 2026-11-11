import { InstanceBase, runEntrypoint } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import upgradeScripts from './upgrades.js'
import { MediaTimer } from './src/media-timer.js'
import { getMediaVariables, getMediaFeedbacks, getMediaActions, getMediaPresets } from './src/media-definitions.js'

import fetch from 'node-fetch'
import WebSocket from 'ws'
import { XMLParser } from 'fast-xml-parser'
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', allowBooleanAttributes: true })

class TricasterInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.lastStatus = {}
		// Media timer: remaining time etc. of DDR/GFX/Sound, fed by the change_notifications below
		this.mt = new MediaTimer({
			log: (level, msg) => this.log(level, msg),
			onVariables: (vars) => this.setVariableValues(vars),
			onFeedbacks: (ids) => this.checkFeedbacks(...ids),
			onChannels: () => {
				this.initVariables()
				this.initFeedbacks()
				this.initActions()
				this.initPresets()
			},
		})
	}

	/** updateStatus only on change (was called on every HTTP response → log spam at ~9 Hz) */
	setStatus(status, message = null) {
		if (this.lastStatus.status === status && this.lastStatus.message === message) return
		this.lastStatus = { status, message }
		this.updateStatus(status, message)
	}

	async init(config) {
		this.config = config
		this.setStatus('connecting')
		clearTimeout(this.retryConnection)

		// Define actions/feedbacks/presets right away, so existing buttons do not fail with
		// "Unknown action" while the TriCaster is not (yet) reachable
		this.initStates()
		this.initVariables()
		this.initFeedbacks()
		this.initActions()
		this.initPresets()

		if (this.config.host) {
			this.initConnection()
		} else {
			this.setStatus('bad_config', 'Missing IP or hostname')
			this.log('error', 'Please configure the IP address or hostname of your Tricaster in the module settings')
		}
	}

	async destroy() {
		this.destroyed = true
		clearTimeout(this.retryConnection)
		this.mt.stop()
		if (this.pollDatalink) {
			clearInterval(this.pollDatalink)
		}
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}
		if (this.ws !== undefined) {
			this.ws.close(1000)
			delete this.ws
		}
		if (this.websocketPing) {
			clearInterval(this.websocketPing)
		}
		if (this.reconnect) {
			clearInterval(this.reconnect)
		}
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Tricaster IP or Hostname',
				width: 6,
			},
			{
				type: 'checkbox',
				id: 'datalink',
				label: 'DataLink Variables',
				default: false,
			},
			{
				type: 'checkbox',
				id: 'media_timer',
				label: 'Media timer (remaining time of DDR/GFX/Sound)',
				width: 6,
				default: true,
			},
			{
				type: 'dropdown',
				id: 'time_format',
				label: 'Media timer time format',
				width: 6,
				default: 'auto',
				isVisible: (options) => options.media_timer !== false,
				choices: [
					{ id: 'auto', label: 'Auto (m:ss / h:mm:ss)' },
					{ id: 'hms', label: 'hh:mm:ss' },
					{ id: 'tc', label: 'hh:mm:ss:ff (timecode)' },
					{ id: 'sec', label: 'Seconds' },
				],
			},
		]
	}

	async configUpdated(config) {
		this.config = config
		this.setStatus('connecting')
		clearInterval(this.pollDatalink)
		this.mt.stop()

		this.init(config)
	}

	initVariables() {
		const variables = [...getVariables.bind(this)(), ...getMediaVariables.call(this)]
		this.setVariableDefinitions(variables)
		this.mt.lastVars = {} // re-send all media timer values after (re)definition
	}

	initFeedbacks() {
		const feedbacks = { ...getFeedbacks.bind(this)(), ...getMediaFeedbacks.call(this) }
		this.setFeedbackDefinitions(feedbacks)
	}

	initPresets() {
		const presets = { ...getPresets.bind(this)(), ...getMediaPresets.call(this) }
		this.setPresetDefinitions(presets)
	}

	initActions() {
		const actions = { ...getActions.bind(this)(), ...getMediaActions.call(this) }
		this.setActionDefinitions(actions)
	}

	startMediaTimer() {
		this.mt.stop()
		if (this.config.media_timer === false) return
		this.mt.configure({
			host: this.config.host,
			external: true,
			timeFormat: this.config.time_format || 'auto',
		})
		this.mt.start()
		this.mt.pollPlaylist()
	}

	async initConnection() {
		let version = await this.awaitRequest('version')
		let shortcuts = await this.awaitRequest('dictionary?key=shortcut_states') //This allows older firmware that don't support the version call to still connect

		if (version?.product_information || shortcuts) {
			if (this.connectRetries) this.log('info', 'Tricaster reachable again')
			this.connectRetries = 0
			this.setStatus('ok')
			this.initStates()
			this.initWebsocket()

			this.initVariables()
			this.initFeedbacks()
			this.initActions() // actions before presets – presets reference them
			this.initPresets()
			this.startMediaTimer()

			this.processData(version)
			this.getInputs()

			this.sendGetRequest('dictionary?key=macros_list')
			this.sendGetRequest('dictionary?key=shortcut_states')

			if (this.config.datalink) {
				this.sendGetRequest('datalink')
				if (this.pollDatalink) {
					clearInterval(this.pollDatalink)
				}
				this.pollDatalink = setInterval(() => {
					this.sendGetRequest('datalink')
				}, 1000)
			}
		} else {
			this.setStatus('connection_failure')
			if (!this.connectRetries) {
				this.log('error', 'Unable to connect to Tricaster. Check your device address in the module settings')
			}
			// Retry until the TriCaster is reachable (e.g. Companion started before the TriCaster, or after sleep)
			this.connectRetries = (this.connectRetries || 0) + 1
			clearTimeout(this.retryConnection)
			if (!this.destroyed) this.retryConnection = setTimeout(() => this.initConnection(), 5000)
		}
	}

	initStates() {
		//Switcher
		this.switcher = {}
		this.system_macros = []
		this.custom_macros = []
		this.datalink = []
		this.shortcut_states = []
		this.transitions = [
			{ id: '-1', label: 'Cut' },
			{ id: '0', label: 'Fade' },
		]
		//M/Es
		this.meDestinations = []
		this.meList = [
			{
				id: `main`,
				label: `Main`,
			},
		]
		//Inputs
		this.inputs = []
		this.mediaTargets = []
		this.mediaSourceNames = []
		//Stills
		this.mediaTargets.push({
			id: `stills_play`,
			label: `Stills Play`,
		})
		this.mediaSourceNames.push({
			id: `stills`,
			label: `Stills`,
		})
		this.mediaTargets.push({
			id: `stills_play_toggle`,
			label: `Stills Play Toggle`,
		})
		this.mediaTargets.push({
			id: `stills_stop`,
			label: `Stills Stop`,
		})
		this.mediaTargets.push({
			id: `stills_back`,
			label: `Stills Back`,
		})
		this.mediaTargets.push({
			id: `stills_forward`,
			label: `Stills Forward`,
		})
		//Titles
		this.mediaTargets.push({
			id: `titles_play`,
			label: `Titles Play`,
		})
		this.mediaTargets.push({
			id: `titles_play_toggle`,
			label: `Titles Play Toggle`,
		})
		this.mediaTargets.push({
			id: `titles_stop`,
			label: `Titles Stop`,
		})
		this.mediaTargets.push({
			id: `titles_back`,
			label: `Titles Back`,
		})
		this.mediaTargets.push({
			id: `titles_forward`,
			label: `Titles Forward`,
		})
		this.mediaSourceNames.push({
			id: `titles`,
			label: `Titles`,
		})
		this.mediaSourceNames.push({
			id: `sound`,
			label: `Sound`,
		})
		//DSK
		this.dskDestinations = []
		for (let dsk = 1; dsk < 5; dsk++) {
			this.dskDestinations.push({
				id: `main_dsk${dsk}`,
				label: `MAIN DSK ${dsk}`,
			})
		}
	}

	async getInputs() {
		let tallyData = await this.awaitRequest('dictionary?key=tally')
		let states = await this.awaitRequest('dictionary?key=shortcut_states')
		let transitions = await this.awaitRequest('dictionary?key=switcher_ui_effects')

		let inputVars = {}

		if (tallyData?.tally) this.updateMediaTally(tallyData.tally)

		if (tallyData && states) {
			tallyData.tally.column.forEach((input) => {
				//Create Inputs
				//Regex prevents excess DDR/GFX A/B Inputs from being visible
				if (!input.name.match(/[d,g][d,f][r,x][1-2](_)[a,b]/i)) {
					let longName = states.shortcut_states.shortcut_state.find((x) => x.name == `${input.name}_long_name`)
					let shortName = states.shortcut_states.shortcut_state.find((x) => x.name == `${input.name}_short_name`)

					if (longName) {
						longName = longName.value

						if (shortName) {
							shortName = shortName.value
						} else {
							shortName = input.name
						}

						this.inputs.push({
							id: input.index,
							label: longName,
							inputName: input.name,
							long_name: longName,
							short_name: shortName,
							on_pgm: input.on_pgm,
							on_prev: input.on_prev,
							ndiInput: input.ndi_id ? true : false,
						})
						inputVars[`${input.name}`] = longName
					}
				}
				//Create M/Es
				if (input.name.match(/v[0-9]/i)) {
					let index = input.name.replace(/v/, '')
					this.meDestinations.push({
						id: `v${index}_a_row`,
						label: `M/E ${index} PGM`,
					})
					this.meDestinations.push({
						id: `v${index}_b_row`,
						label: `M/E ${index} PVW`,
					})
					this.meList.push({
						id: `v${index}`,
						label: `M/E ${index}`,
					})
					for (let dsk = 1; dsk < 5; dsk++) {
						this.dskDestinations.push({
							id: `v${index}_dsk${dsk}`,
							label: `M/E ${index} DSK ${dsk}`,
						})
					}
				}
				//Create DDR
				if (input.name.match(/^ddr[0-4]$/i)) {
					let index = input.name.replace(/ddr/, '')
					this.mediaTargets.push({
						id: `ddr${index}_play`,
						label: `DDR ${index} Play`,
					})
					this.mediaTargets.push({
						id: `ddr${index}_play_toggle`,
						label: `DDR ${index} Play Toggle`,
					})
					this.mediaTargets.push({
						id: `ddr${index}_stop`,
						label: `DDR ${index} Stop`,
					})
					this.mediaTargets.push({
						id: `ddr${index}_back`,
						label: `DDR ${index} Back`,
					})
					this.mediaTargets.push({
						id: `ddr${index}_forward`,
						label: `DDR ${index} Forward`,
					})
					this.mediaTargets.push({
						id: `ddr${index}_mark_in`,
						label: `DDR ${index} Mark In`,
					})
					this.mediaTargets.push({
						id: `ddr${index}_mark_out`,
						label: `DDR ${index} Mark Out`,
					})
					this.mediaSourceNames.push({
						id: `ddr${index}`,
						label: `DDR ${index}`,
					})
				}
				//Create GFX
				if (input.name.match(/^gfx[0-4]$/i)) {
					let index = input.name.replace(/gfx/, '')
					this.mediaTargets.push({
						id: `gfx${index}_play`,
						label: `GFX ${index} Play`,
					})
					this.mediaTargets.push({
						id: `gfx${index}_play_toggle`,
						label: `GFX ${index} Play Toggle`,
					})
					this.mediaTargets.push({
						id: `gfx${index}_stop`,
						label: `GFX ${index} Stop`,
					})
					this.mediaTargets.push({
						id: `gfx${index}_back`,
						label: `GFX ${index} Back`,
					})
					this.mediaTargets.push({
						id: `gfx${index}_forward`,
						label: `GFX ${index} Forward`,
					})
					this.mediaSourceNames.push({
						id: `gfx${index}`,
						label: `GFX ${index}`,
					})
				}
			})
		}
		if (transitions) {
			transitions.switcher_ui_effects.switcher.forEach((switcher) => {
				if (switcher.name === 'main') {
					let int = 0
					for (let x in switcher.effect_bin) {
						let transition = switcher.effect_bin[x]
						let name = transition?.effect?.match(/[^\\]+\.trans$/i)
						if (name) {
							name = name[0].replace('.trans', '')
							this.transitions.push({ id: ++int, label: name })
						}
					}
				}
			})
		}

		this.sendGetRequest('dictionary?key=switcher') //Wait until input names are defined before getting pgm/prv info

		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()

		this.setVariableValues(inputVars)
		this.checkFeedbacks('tally_PGM', 'tally_PVW')
	}

	initWebsocket() {
		clearInterval(this.reconnect)

		if (this.ws !== undefined) {
			this.ws.close(1000)
			delete this.ws
		}

		this.ws = new WebSocket(`ws://${this.config.host}/v1/change_notifications`)

		this.ws.on('open', () => {
			// ping server every 15 seconds to keep connection open
			this.websocketPing = setInterval(() => {
				if (this.ws) {
					if (this.ws.readyState == 1) {
						this.ws.send('keep alive')
					}
					// readyState 2 = CLOSING, readyState 3 = CLOSED
					else if (this.ws.readyState == 2 || this.ws.readyState == 3 || this.ws) {
						clearInterval(this.websocketPing)
					}
				} else {
					clearInterval(this.websocketPing)
				}
			}, 15000)
		})

		this.ws.on('message', (data, isBinary) => {
			let msg = isBinary ? data : data.toString()

			if (msg) {
				const key = msg.trim()
				if (key === 'ddr_timecode') {
					// ~9 Hz while playing: handled by the media timer (coalesced, never overlapping)
					if (this.config.media_timer !== false) this.mt.requestTimecode()
				} else if (key === 'ddr_playlist') {
					if (this.config.media_timer !== false && !this.mt._plInFlight) this.mt.pollPlaylist()
				} else {
					this.sendGetRequest(`dictionary?key=${key}`)
				}
			}
		})

		this.ws.on('close', (code) => {
			if (code !== 1000) {
				this.reconnect = setInterval(() => {
					this.initWebsocket()
				}, 500)
			}
		})

		this.ws.on('error', (data, isBinary) => {
			let msg = isBinary ? data : data.toString()
			this.log('debug', msg)
		})
	}

	sendGetRequest(request) {
		let url = `http://${this.config.host}/v1/${request}`
		fetch(url)
			.then((res) => {
				if (res.status == 200) {
					this.setStatus('ok')
					return res.text()
				} else if (res.status == 401) {
					this.setStatus('bad_config', 'Authentication Error')
				}
			})
			.then((data) => {
				let object = parser.parse(data)
				this.processData(object)
			})
			.catch((error) => {
				let errorText = String(error)
				if (errorText.match('ETIMEDOUT') || errorText.match('ENOTFOUND') || errorText.match('ECONNREFUSED')) {
					this.setStatus('connection_failure')
				}
				this.log('debug', errorText)
			})
	}

	async awaitRequest(request) {
		let url = `http://${this.config.host}/v1/${request}`

		try {
			// timeout: without it an unreachable host blocks for the OS TCP timeout (~75 s on macOS)
			let result = await fetch(url, { signal: AbortSignal.timeout(3000) })
			let data = await result.text()
			let object = await parser.parse(data)
			return object
		} catch (error) {
			this.log('debug', error)
		}
	}

	sendCommand(name, value, custom) {
		let cmd = `shortcut?name=${name}`
		if (value) {
			cmd = `shortcut?name=${name}&value=${value}`
		}
		let url = `http://${this.config.host}/v1/${cmd}`

		if (custom) {
			url = `http://${this.config.host}/v1/${custom}`
		}

		fetch(url)
			.then((res) => {
				if (res.status == 200) {
					this.setStatus('ok')
				} else if (res.status == 401) {
					this.setStatus('bad_config', 'Authentication Error')
				}
			})
			.catch((error) => {
				let errorText = String(error)
				if (errorText.match('ETIMEDOUT') || errorText.match('ENOTFOUND') || errorText.match('ECONNREFUSED')) {
					this.setStatus('connection_failure')
				}
				this.log('debug', errorText)
			})
	}

	processData(data) {
		if (data?.shortcut_state && !data.shortcut_states) {
			// Reply to dictionary?key=state.<name> (sent after a 'state.<name>' change notification):
			// a single <shortcut_state/>. Handle it like a one-entry shortcut_states list.
			data = { shortcut_states: { shortcut_state: [data.shortcut_state] } }
		}
		if (data?.shortcut_states?.shortcut_state && !Array.isArray(data.shortcut_states.shortcut_state)) {
			data.shortcut_states.shortcut_state = [data.shortcut_states.shortcut_state]
		}
		if (data.tally) {
			this.updateMediaTally(data.tally)
			data.tally.column.forEach((input) => {
				let inputData = this.inputs.find((x) => x.id == input.index)
				if (inputData) {
					inputData.on_pgm = input.on_pgm
					inputData.on_prev = input.on_prev
				}
			})
			this.checkFeedbacks('tally_PGM', 'tally_PVW')
		} else if (data.product_information) {
			this.switcher.info = data.product_information

			this.log('info', `Connected to ${this.switcher.info.machine_name} at ${this.config.host}`)

			this.setVariableValues({
				product_name: this.switcher.info.product_name,
				hostname: this.switcher.info.machine_name,
				product_version: this.switcher.info.product_version,
				session_name: this.switcher.info.session_name,
			})
		} else if (data.switcher_update) {
			let pgmSource = data.switcher_update.main_source
			let pvwSource = data.switcher_update.preview_source

			pgmSource = this.inputs.find((x) => x.inputName == pgmSource.toLowerCase())
			pvwSource = this.inputs.find((x) => x.inputName == pvwSource.toLowerCase())

			this.setVariableValues({
				pgm_source: pgmSource?.short_name ? pgmSource.short_name : data.switcher_update.main_source,
				pvw_source: pvwSource?.short_name ? pvwSource.short_name : data.switcher_update.preview_source,
			})
		} else if (data.macros) {
			this.custom_macros = []
			data.macros.systemfolder.macro.forEach((macro) => {
				this.system_macros.push({
					id: macro.name,
					label: macro.name,
				})
			})

			let sessionMacros = data.macros.sessionfolder
			if (sessionMacros.macro?.length > 1) {
				sessionMacros.macro.forEach((macro) => {
					this.custom_macros.push({
						id: macro.name,
						label: macro.name,
					})
				})
			} else if (sessionMacros.macro) {
				let macro = sessionMacros.macro
				this.custom_macros.push({
					id: macro.name,
					label: macro.name,
				})
			}
			if (data.macros.folder?.length > 1) {
				data.macros.folder?.forEach((folder) => {
					if (folder.macro?.length > 1) {
						folder.macro.forEach((macro) => {
							this.custom_macros.push({
								id: macro.name,
								label: macro.name,
							})
						})
					} else if (folder.macro) {
						this.custom_macros.push({
							id: folder.macro.name,
							label: folder.macro.name,
						})
					}
				})
			} else if (data.macros.folder) {
				let folder = data.macros.folder
				if (folder.macro?.length > 1) {
					folder.macro.forEach((macro) => {
						this.custom_macros.push({
							id: macro.name,
							label: macro.name,
						})
					})
				} else if (folder.macro) {
					this.custom_macros.push({
						id: folder.macro.name,
						label: folder.macro.name,
					})
				}
			}
			this.initActions()
		} else if (data.shortcut_states) {
			const mediaStates = {}
			data.shortcut_states?.shortcut_state.forEach((state) => {
				if (state?.name) mediaStates[state.name] = state.value
				if (state.name.match(/_short_name/)) {
					let input = this.inputs.find((x) => x.inputName == state.name.replace('_short_name', ''))
					if (input) {
						if (input.short_name !== state.value) {
							input.short_name = state.value
						}
					}
				} else if (state.name.match(/_long_name/)) {
					let input = this.inputs.find((x) => x.inputName == state.name.replace('_long_name', ''))
					if (input) {
						if (input?.long_name !== state.value) {
							input.label = state.value
							input.long_name = state.value
							this.initActions()
							this.initPresets()
						}
					}
				} else if (state.name == 'record_toggle') {
					this.switcher.recording = state.value > 0 ? true : false
					this.setVariableValues({ recording: this.switcher.recording ? 'Recording' : 'Stopped' })
					this.checkFeedbacks('recording')
				} else if (state.name == 'streaming_toggle') {
					this.switcher.streaming = state.value == '1' ? true : false
					this.setVariableValues({ streaming: this.switcher.streaming ? 'Streaming' : 'Stopped' })
					this.checkFeedbacks('streaming')
				} else if (
					state.name.match(/ddr[0-9]_play/) ||
					state.name.match(/gfx[0-9]_play/) ||
					state.name.match(/stills_play/) ||
					state.name.match(/titles_play/) ||
					state.name.match(/sound_play/)
				) {
					this.shortcut_states[`${state.name}`] = state.value
					this.checkFeedbacks('mediaPlaying')
				} else if (state.name.match(/dsk[0-4]_value/)) {
					this.shortcut_states[`${state.name}`] = state.value == '1' ? true : false
					this.checkFeedbacks('dskOnAir')
				} else if (state.name.match(/v[0-4]_delegate/) || state.name.match(/main_delegate/)) {
					let selected = state.value.split('|')
					this.shortcut_states[`${state.name}`] = selected
				}
			})
			this.mt.mergeShortcutStates(mediaStates)
		} else if (data.datalink_values) {
			if (this.datalink.length !== data.datalink_values.data.length) {
				this.datalink = data.datalink_values.data
				this.initVariables()
			}

			let updatedVariables = {}
			data.datalink_values.data.forEach((element) => {
				let name = element.key.replace(/[\W]/gi, '')
				updatedVariables[`${name}`] = element.value
			})
			this.setVariableValues(updatedVariables)
		} else {
		}
	}

	/** Program tally → media timer ("on air" per media player) */
	updateMediaTally(tally) {
		const columns = Array.isArray(tally?.column) ? tally.column : tally?.column ? [tally.column] : []
		const onPgm = columns.filter((c) => String(c.on_pgm) === 'true').map((c) => c.name)
		this.mt.setProgramTally(onPgm)
	}

	checkDelegateStatus(current, v, item) {}
}

runEntrypoint(TricasterInstance, upgradeScripts)
