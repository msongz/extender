import { loadPref, prefKeys } from '../preferences.js'

export function createTemplateToolState() {
    return {
        footerMessage: loadPref(prefKeys.footerMessage, 'Template status ready'),
    }
}
