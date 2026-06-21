import merge from 'just-merge'
import expression from '../expression.js?text'

const toolDefaults = { source: 'extender', dockable: true }

export const toolSettings = merge(toolDefaults, { version: PRODUCT_VERSION })

export const frameOptions = {
    title: PRODUCT_DISPLAY_NAME,
    versionText: `v${PRODUCT_VERSION}`,
    developerText: '@songz',
    projectUrl: 'https://github.com/msongz/extender',
    developerUrl: 'https://github.com/msongz',
    borderHex: '709536',
}

const envMessage =
    typeof IM_IN_ENV !== 'undefined'
        ? IM_IN_ENV
        : 'Create .env from .env.example to customize this message.'

export function getHomeMessages() {
    return [expression, envMessage]
}
