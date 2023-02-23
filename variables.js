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
		variableId: 'pgm_source',
		name: 'Source on Program',
	})
	variables.push({
		variableId: 'pvw_source',
		name: 'Source on Preview',
	})
	variables.push({
		variableId: 'recording',
		name: 'Recording',
	})
	variables.push({
		variableId: 'streaming',
		name: 'Streaming',
	})

	return variables
}
