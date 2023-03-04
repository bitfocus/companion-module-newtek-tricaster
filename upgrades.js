import { CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'

export default [
	CreateConvertToBooleanFeedbackUpgradeScript({
		tally_PGM: true,
		tally_PVW: true,
		tally_record: true,
		tally_streaming: true,
		play_media: true,
	}),
	function upgrade200(context, props) {
		const changes = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		if (props.config) {
			if (props.config.info !== undefined) {
				delete props.config.info
			}
			if (props.config.pollInterval !== undefined) {
				props.config.datalink = true
				delete props.config.pollInterval
			} else {
				props.config.datalink = false
			}
			changes.updatedConfig = props.pollInterval
		}

		for (let action of props.actions) {
			if (action.options === undefined) {
				action.options = {}
			}

			switch (action.actionId) {
				case 'record_start':
					action.actionId = 'record'
					action.options.record = 1
					changes.updatedActions.push(action)
					break
				case 'record_stop':
					action.actionId = 'record'
					action.options.record = 0
					changes.updatedActions.push(action)
					break
				case 'streaming':
					action.actionId = 'stream'
					action.options.stream = action.options.force
					delete action.options.force
					changes.updatedActions.push(action)
					break
				case 'trigger':
					action.actionId = 'customMacro'
					changes.updatedActions.push(action)
					break
				case 'macros':
					action.actionId = 'systemMacro'
					changes.updatedActions.push(action)
					break
			}
		}

		for (let feedback of props.feedbacks) {
			if (feedback.options === undefined) {
				feedback.options = {}
			}

			switch (feedback.feedbackId) {
				case 'play_media':
					if (feedback.options.target) {
						feedback.options.target = feedback.options.target.replace(/_play/, '')
					} else {
						feedback.options.target = 'ddr1'
					}
					feedback.feedbackId = 'mediaPlaying'
					changes.updatedFeedbacks.push(feedback)
					break
				case 'tally_record':
					feedback.feedbackId = 'recording'

					changes.updatedFeedbacks.push(feedback)
					break
				case 'tally_streaming':
					feedback.feedbackId = 'streaming'

					changes.updatedFeedbacks.push(feedback)
					break
			}
		}

		return changes
	},
]
