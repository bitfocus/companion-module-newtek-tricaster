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

		return changes
	},
]
