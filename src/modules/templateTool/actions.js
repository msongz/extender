import { notify } from '../utils.js'
import { prefKeys, savePref } from '../preferences.js'

export function inspectSettings(settings) {
    notify(`Current settings:\n${JSON.stringify(settings, null, 2)}`)
}

export function updateFooterMessage(frame, state, value) {
    state.footerMessage = value
    savePref(prefKeys.footerMessage, value)
    frame.flashVersionInfo(value)
}
