const DEFAULT_LOCALE = 'en_US'

const messages = {
    'frame.settingsTitle': {
        en_US: 'Settings',
        zh_CN: '设置',
    },
    'frame.settingsButton': {
        en_US: 'Settings',
        zh_CN: '设置',
    },
    'frame.backButton': {
        en_US: 'Back',
        zh_CN: '返回',
    },
    'frame.settingsHelpTip': {
        en_US: 'Toggle settings',
        zh_CN: '切换设置',
    },
    'frame.versionHelpTip': {
        en_US: 'Open project page',
        zh_CN: '打开项目页面',
    },
    'frame.developerHelpTip': {
        en_US: 'Open developer page',
        zh_CN: '打开开发者页面',
    },
}

function normalizeLocale(locale) {
    locale = String(locale || '').replace('-', '_').toLowerCase()

    if (locale.indexOf('zh') === 0) {
        return 'zh_CN'
    }

    return DEFAULT_LOCALE
}

function getConfiguredLocale() {
    try {
        if (I18N_LOCALE) return I18N_LOCALE
    } catch (_error) {}

    try {
        if (app.isoLanguage) return app.isoLanguage
    } catch (_error2) {}

    try {
        if ($.locale) return $.locale
    } catch (_error3) {}

    return DEFAULT_LOCALE
}

export function getLocale() {
    return normalizeLocale(getConfiguredLocale())
}

export function t(key, params) {
    const locale = getLocale()
    const message = messages[key] || {}
    let template = message[locale] || message[DEFAULT_LOCALE] || key

    params = params || {}
    for (const paramKey in params) {
        template = template.split('{' + paramKey + '}').join(String(params[paramKey]))
    }

    return template
}
