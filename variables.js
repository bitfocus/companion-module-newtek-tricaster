export function getVariables() {
	const variables = []

	variables.push({
		variableId: 'product_name',
		name: 'Product name',
	})
	variables.push({
		variableId: 'product_version',
		name: 'Product version',
	})
	variables.push({
		variableId: 'hostname',
		name: 'Hostname',
	})
	variables.push({
		variableId: 'session_name',
		name: 'Session name',
	})
	variables.push({
		variableId: 'pgm_source',
		name: 'Source on Program',
	})
	variables.push({
		variableId: 'pvw_source',
		name: 'Source on Preview',
	})
	variables.push({
		variableId: 'recording',
		name: 'Recording Status',
	})
	variables.push({
		variableId: 'streaming',
		name: 'Streaming Status',
	})

	if (this.config.datalink && this.datalink) {
		this.datalink.forEach((element) => {
			let name = element.key.replace(/[\W]/gi, '')
			variables.push({ variableId: name, name: name })
		})
	}

	return variables
}
