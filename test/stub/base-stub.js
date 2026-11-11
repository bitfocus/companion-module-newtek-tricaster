// Minimal stand-in for @companion-module/base to instantiate the module without Companion
export class InstanceBase {
	constructor() {
		this.label = 'tricaster'
		this.vars = {}
		this.statusLog = []
		this.logs = []
		this.fbChecks = 0
		this.presetProblems = []
	}
	updateStatus(status, message) {
		this.statusLog.push([Date.now(), status, message ?? null])
	}
	log(level, msg) {
		this.logs.push([level, String(msg)])
	}
	setVariableDefinitions(d) {
		this.varDefs = d
	}
	setVariableValues(v) {
		Object.assign(this.vars, v)
	}
	setFeedbackDefinitions(d) {
		this.fbDefs = d
	}
	setActionDefinitions(d) {
		this.actDefs = d
	}
	setPresetDefinitions(d) {
		this.presetDefs = d
		// like Companion: presets may only reference existing actions
		const missing = new Set()
		for (const p of Object.values(d))
			for (const st of p.steps || [])
				for (const a of st.down || []) if (!this.actDefs?.[a.actionId]) missing.add(a.actionId)
		if (missing.size) this.presetProblems.push([...missing])
	}
	checkFeedbacks(...ids) {
		this.fbChecks++
	}
}
export function runEntrypoint(cls) {
	globalThis.__ModuleClass = cls
}
export function combineRgb(r, g, b) {
	return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
}
export function CreateConvertToBooleanFeedbackUpgradeScript() {
	return () => ({ updatedConfig: null, updatedActions: [], updatedFeedbacks: [] })
}
