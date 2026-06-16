/// <reference types="types-for-adobe/AfterEffects/18.0"/>
/// <reference types="types-for-adobe/shared/ScriptUI"/>

import { notify } from './modules/utils.js'
import { createPanel, showPanel } from './modules/panel.js'
import merge from 'just-merge'
import expression from './modules/expression.js?text'
import icon from './icons/icon.png'

const defaults = { source: 'extender', dockable: true }
const settings = merge(defaults, { version: PRODUCT_VERSION })
const messages = [expression, IM_IN_ENV]

const panel = createPanel(thisObj, PRODUCT_DISPLAY_NAME, {
    resizeable: true,
    alignChildren: ['fill', 'top'],
})

if (panel) {
    const header = panel.add('group')
    header.orientation = 'row'
    header.alignChildren = ['left', 'center']

    header.add('iconbutton', undefined, File.decode(icon))
    header.add('statictext', undefined, `${PRODUCT_DISPLAY_NAME} ${PRODUCT_VERSION}`)

    messages.forEach((message) => {
        const text = panel.add('statictext', undefined, message, { multiline: true })
        text.alignment = ['fill', 'top']
    })

    const inspectButton = panel.add('button', undefined, 'Inspect settings')
    inspectButton.onClick = function () {
        notify(`Current settings:\n${JSON.stringify(settings, null, 2)}`)
    }

    showPanel(panel)
}
