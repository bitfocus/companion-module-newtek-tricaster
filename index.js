import { InstanceBase, runEntrypoint, TCPHelper } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import upgradeScripts from './upgrades.js'

import fetch from 'node-fetch'
import WebSocket from 'ws'
import { parseString } from 'xml2js'
import { XMLParser } from 'fast-xml-parser'
const parser = new XMLParser()

class TricasterInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.updateStatus('connecting')

		this.initVariables()
		this.connections()

		this.session = false
		this.switcher = []
		this.inputs = []
		this.system_macros = []
		this.custom_macros = []
		this.tally = []
		this.tallyPVW = []
		this.tallyPGM = []
		this.datalink = []
		this.shortcut_states = []
		this.variables = []
		this.mediaTargets = []
		this.mediaSourceNames = []

		this.meDestinations = []
		this.meList = []
		this.dskDestinations = []
		this.createDskDestinations()
		this.createMediaTargets()
		this.createMeDestinations()
	}

	async destroy() {
		if (this.pollAPI) {
			clearInterval(this.pollAPI)
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
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module connects to a Tricaster.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Tricaster IP',
				width: 6,
			},
			{
				type: 'static-text',
				id: 'info',
				width: 10,
				label: 'Polling Information',
				value: 'Polling is required for DataLink variables (0 for off, interval must be 500ms or larger)',
			},
			{
				type: 'textinput',
				id: 'pollInterval',
				label: 'Polling Interval',
				width: 4,
				default: '0',
			},
		]
	}

	async configUpdated(config) {
		this.config = config
		this.updateStatus('connecting')
		clearInterval(this.pollAPI)

		this.initFeedbacks()
		this.connections()
		this.initVariables()
	}

	initVariables() {
		const variables = getVariables.bind(this)()
		this.setVariableDefinitions(variables)
	}

	initFeedbacks() {
		const feedbacks = getFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	initPresets() {
		const presets = getPresets.bind(this)()
		this.setPresetDefinitions(presets)
	}

	initActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}

	createMeDestinations() {
		this.meList.push({
			id: `main`,
			label: `Main`,
		})
		for (let index = 1; index < 9; index++) {
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
	}

	createDskDestinations() {
		for (let dsk = 1; dsk < 5; dsk++) {
			this.dskDestinations.push({
				id: `main_dsk${dsk}`,
				label: `main dsk ${dsk}`,
			})
		}
	}
	/**
	 * Creating of media targets
	 */
	createMediaTargets() {
		for (let index = 1; index < 5; index++) {
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
		for (let index = 1; index < 3; index++) {
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
	}

	connections() {
		// Settings must be made first
		if (this.config.host !== undefined) {
			this.init_TCP()
			this.initFeedbacks()
			this.initPresets()
			this.updateStatus('ok')
		} else {
			this.updateStatus('bad_config', 'Missing IP or hostname')
			this.log('error', 'Please configure the IP address or hostname of your Tricaster in the module settings')
		}
	}

	/**
	 * Set the TCP connection to send shortcuts to the mixer, should be the fastest option
	 */
	init_TCP() {
		this.config.port = 5951 // Fixed port
		this.inputBuffer = Buffer.from('')

		if (this.config.host !== undefined) {
			if (this.socket !== undefined) {
				this.socket.destroy()
				delete this.socket
			}

			this.updateStatus('connecting')
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message) // Update status when something happens
			})
			this.socket.on('error', (err) => {
				if (err.errno === 'ECONNREFUSED') {
					this.log('TCP error: ' + err)
					this.updateStatus('connection_failure', err)
				} else if (this.session) {
					this.updateStatus('connection_failure', err)
					this.log('error', 'Network error: ' + err.message)
				}
			})

			this.socket.on('connect', () => {
				this.updateStatus('ok')
				this.session = true
				// Ask the mixer to give us variable (register/state) updates on connection
				this.socket.send(`<register name="NTK_states"/>\n`)
				// Get all initial info needed
				this.sendGetRequest(`http://${this.config.host}/v1/version`) // Fetch mixer info
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch initial input info
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=macros_list`) // Fetch macros
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher changes
				if (this.config.pollInterval != 0) {
					this.sendGetRequest(`http://${this.config.host}/v1/datalink`) // Fetch datalink stuff
					if (this.pollAPI) {
						clearInterval(this.pollAPI)
					}
					this.pollAPI = setInterval(
						() => {
							this.sendGetRequest(`http://${this.config.host}/v1/datalink`) // Fetch datalink stuff
						},
						this.config.pollInterval < 500 ? 500 : this.config.pollInterval
					)
				}
				this.init_websocket_listener()
			})

			this.socket.on('data', (inputData) => {
				clearTimeout(this.errorTimer)

				this.inputBuffer = Buffer.concat([this.inputBuffer, inputData])

				parseString(Buffer.from('<root>' + this.inputBuffer.toString() + '</root>'), (err, result) => {
					if (!err) {
						this.inputBuffer = Buffer.from('')
						this.incomingData(result.root)
					} else {
						this.errorTimer = setTimeout(() => {
							throw 'Timeout getting a complete xml packet'
						}, 500)
					}
				})
			})
		}
	}

	init_websocket_listener() {
		clearInterval(this.reconnect)

		if (this.ws !== undefined) {
			this.ws.close(1000)
			delete this.ws
		}

		const url = 'ws://' + this.config.host + '/v1/change_notifications'
		this.ws = new WebSocket(url)

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

		this.ws.on('message', (msg) => {
			if (msg.search('tally') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=tally`) // Fetch tally changes
			}
			if (msg.search('switcher') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher changes
			}
			if (msg.search('macros_list') != '-1') {
				this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=macros_list`) // Fetch macro changes
			}
		})

		this.ws.on('close', (code) => {
			if (code !== 1000) {
				this.reconnect = setInterval(() => {
					this.init_websocket_listener()
				}, 500)
			}
		})

		this.ws.on('error', (msg) => {
			this.log('debug', msg.data)
		})
	}

	/**
	 * @param  {} states
	 */
	shortcutStatesIngest(states) {
		states?.forEach((element) => {
			if (element['$']['name'].match(/_short_name/)) {
				const index = this.inputs.findIndex((el) => el.name == element['$']['name'].slice(0, -11))
				if (index != -1) {
					this.inputs[index].short_name = element['$']['value']
					this.setVariableValues({ [`${this.inputs[index].name}`]: element['$']['value'] })
				}
				const va_index = this.meDestinations.findIndex(
					(el) => el.label.slice(0, -6) == element['$']['name'].slice(0, -11)
				)
				if (va_index != -1) {
					this.meDestinations[va_index].label = element['$']['value'] + ' a bus'
				}
				const vb_index = this.meDestinations.findIndex(
					(el) => el.label.slice(0, -6) == element['$']['name'].slice(0, -11)
				)
				if (vb_index != -1) {
					this.meDestinations[vb_index].label = element['$']['value'] + ' b bus'
				}
				this.initActions()
				this.initPresets()
			} else if (element['$']['name'].match(/_long_name/)) {
				const index = this.inputs.findIndex((el) => el.name == element['$']['name'].slice(0, -10))
				if (index != -1) {
					this.inputs[index].long_name = element['$']['value']
					this.inputs[index].label = element['$']['value']
				}
				this.initActions()
				this.initPresets()
			} else if (element['$']['name'].match(/record_toggle/)) {
				this.switcher['recording'] = element['$']['value'] == '1' ? true : false
				this.setVariableValues({ recording: element['$']['value'] == '1' ? true : false })
				this.checkFeedbacks('tally_record')
			} else if (element['$']['name'].match(/streaming_toggle/)) {
				this.switcher['streaming'] = element['$']['value'] == '1' ? true : false
				this.setVariableValues({ streaming: element['$']['value'] == '1' ? true : false })
				this.checkFeedbacks('tally_streaming')
			} else if (
				element['$']['name'].match(/ddr1_play/) ||
				element['$']['name'].match(/ddr2_play/) ||
				element['$']['name'].match(/ddr3_play/) ||
				element['$']['name'].match(/ddr4_play/) ||
				element['$']['name'].match(/gfx1_play/) ||
				element['$']['name'].match(/gfx2_play/) ||
				element['$']['name'].match(/stills_play/) ||
				element['$']['name'].match(/titles_play/) ||
				element['$']['name'].match(/sound_play/)
			) {
				this.shortcut_states[element['$']['name']] = element['$']['value']
				this.checkFeedbacks('play_media')
			}
		})

		this.sendGetRequest(`http://${this.config.host}/v1/dictionary?key=switcher`) // Fetch switcher changes for proper PGM/PVW button variable names on start-up
	}
	/**
	 * @param  {} data
	 */
	incomingData(data) {
		if (data.shortcut_states !== undefined) {
			if (Array.isArray(data.shortcut_states)) {
				data.shortcut_states.forEach((states) => {
					this.shortcutStatesIngest(states.shortcut_state)
				})
			} else {
				this.shortcutStatesIngest(data.shortcut_states.shortcut_state)
			}
		} else if (data.shutdown) {
			this.log('warn', 'Tricaster session closed')
			this.session = false
		} else {
			this.log('debug', data)
		}
	}

	sendGetRequest(url) {
		fetch(url)
			.then((res) => {
				if (res.status == 200) {
					this.updateStatus('ok')
					let object = parser.parse(res.body)
					console.log(object)
					this.processData(object)
				} else if (res.status == 401) {
					this.updateStatus('bad_config')
					this.log('error', 'On the Tricaster under Administration Tools, turn off the LivePanel password')
				}
			})
			.then((data) => {})
			.catch((error) => {
				let errorText = String(error)
				if (errorText.match('ETIMEDOUT') || errorText.match('ENOTFOUND') || errorText.match('ECONNREFUSED')) {
					this.updateStatus('connection_failure', result.error.code)
					this.log('error', 'Unable to connect to Tricaster. Check your device address in the module settings')
				} else {
					this.log('debug', errorText)
				}
			})
	}

	processData(data) {
		if (data['tally'] !== undefined) {
			// Set PGM and PVW variable/Feedback
			this.tallyPVW = []
			this.tallyPGM = []
			if (this.inputs.length == 0) {
				let variables = []
				data['tally']['column'].forEach((element) => {
					//Prevent excess DDR/GFX A/B Inputs from being visible
					if (!element['$']['name'].match(/[d,g][d,f][r,x][1-2](_)[a,b]/i)) {
						this.inputs.push({
							id: element['$']['index'],
							label: element['$']['name'],
							name: element['$']['name'],
							long_name: element['$']['name'],
							short_name: element['$']['name'],
						})
						variables.push({ name: `${element['$']['name']}`, label: element['$']['name'] })
					}
				})
				this.set_variablesDefinition(variables)
				this.initFeedbacks() // Same for feedback as it holds the inputs
			}
			data['tally']['column'].forEach((element) => {
				element['$']['on_prev'] == 'true'
					? (this.tallyPVW[element['$']['index']] = 'true')
					: (this.tallyPVW[element['$']['index']] = 'false')
				element['$']['on_pgm'] == 'true'
					? (this.tallyPGM[element['$']['index']] = 'true')
					: (this.tallyPGM[element['$']['index']] = 'false')
			})

			this.checkFeedbacks('tally_PGM', 'tally_PVW')
		} else if (data['product_information'] !== undefined) {
			this.log('info', `Connected to: ${data['product_information']['product_name']} at ${this.config.host}`)
			this.switcher['product_name'] = data['product_information']['product_name']
			this.switcher['product_version'] = data['product_information']['product_version']

			this.setVariableValues({
				product_name: data['product_information']['product_name'],
				product_version: data['product_information']['product_version'],
			})
		} else if (data['switcher_update'] !== undefined) {
			let pgmSource = data['switcher_update']['$']['main_source']
			let pvwSource = data['switcher_update']['$']['preview_source']

			pgmSource = this.inputs.find((el) => el.name == pgmSource.toLowerCase())
			pvwSource = this.inputs.find((el) => el.name == pvwSource.toLowerCase())

			this.setVariableValues({
				pgm_source: pgmSource?.short_name ? pgmSource.short_name : data['switcher_update']['$']['main_source'],
				pvw_source: pvwSource?.short_name ? pvwSource.short_name : data['switcher_update']['$']['preview_source'],
			})
		} else if (data['macros'] !== undefined) {
			// Fetch all macros
			data['macros']['systemfolder']['macro'].forEach((element) => {
				this.system_macros.push({
					id: element['$']['name'],
					label: element['$']['name'],
				})
			})
			this.custom_macros = []

			let sessionMacros = data['macros']['sessionfolder']
			if (sessionMacros.macro?.length > 1) {
				sessionMacros.macro.forEach((macro) => {
					this.custom_macros.push({
						id: macro['$']['name'],
						label: macro['$']['name'],
					})
				})
			} else if (sessionMacros.macro) {
				this.custom_macros.push({
					id: sessionMacros.macro['$']['name'],
					label: sessionMacros.macro['$']['name'],
				})
			}

			data['macros']['folder']?.forEach((folder) => {
				if (folder.macro?.length > 1) {
					folder.macro.forEach((macro) => {
						this.custom_macros.push({
							id: macro['$']['name'],
							label: macro['$']['name'],
						})
					})
				} else if (folder.macro) {
					this.custom_macros.push({
						id: folder.macro['$']['name'],
						label: folder.macro['$']['name'],
					})
				}
			})
			this.initActions() // Reset the actions, marco's could be updated
		} else if (data['shortcut_states'] !== undefined) {
			// Handled by TCP states
		} else if (data['datalink_values'] !== undefined) {
			// This is done by polling
			let variables = []
			let _datalink = []
			data['datalink_values']['data'].forEach((element) => {
				if (this.datalink[element.key] != element.value) this.setVariableValues({ [`${element.key}`]: element.value })
				_datalink[element.key] = element.value

				//FIX THIS
				variables.push({ name: element.key, label: element.key })
			})

			this.datalink = _datalink
		} else {
		}
	}

	sendCommand(name, value) {
		let cmd = `<shortcuts><shortcut name="${name}" /></shortcuts>`
		if (value) {
			cmd = `<shortcuts><shortcut name="${name}" value="${value}" /></shortcuts>`
		}
		this.socket.send(cmd + '\n')

		this.checkFeedbacks('tally_PGM', 'tally_PGM', 'tally_streaming')
	}
}

runEntrypoint(TricasterInstance, upgradeScripts)
