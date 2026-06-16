export const prefSection = `${PRODUCT_NAME}_TemplatePrefs`

export const prefKeys = {
    footerMessage: 'footerMessage',
}

export function savePref(key, value) {
    try {
        app.settings.saveSetting(prefSection, key, String(value))
    } catch (_error) {}
}

export function loadPref(key, defaultValue) {
    try {
        if (app.settings.haveSetting(prefSection, key)) {
            return app.settings.getSetting(prefSection, key)
        }
    } catch (_error) {}

    return defaultValue
}
