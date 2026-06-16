/// <reference types="types-for-adobe/AfterEffects/18.0"/>
/// <reference types="types-for-adobe/shared/ScriptUI"/>

import { notify } from './modules/utils.js'
import { addWindow, show } from '../songz-modules/ui.js'
import merge from 'just-merge'
import expression from './modules/expression.js?text'
import icon from './icons/icon.png'

const defaults = { source: 'extender', dockable: true }
const settings = merge(defaults, { version: PRODUCT_VERSION })
const envMessage =
    typeof IM_IN_ENV !== 'undefined'
        ? IM_IN_ENV
        : 'Create .env from .env.example to customize this message.'
const messages = [expression, envMessage]

const panel = addWindow({
    thisObj,
    titleName: PRODUCT_DISPLAY_NAME,
    resizeable: true,
    alignChildren: ['fill', 'top'],
})

if (panel) {
    const rootGroup = panel.add('group')
    rootGroup.orientation = 'column'
    rootGroup.alignChildren = ['fill', 'top']
    rootGroup.alignment = ['fill', 'fill']
    rootGroup.margins = 0
    rootGroup.spacing = 8

    const header = rootGroup.add('group')
    header.orientation = 'row'
    header.alignChildren = ['left', 'center']

    header.add('iconbutton', undefined, File.decode(icon))
    header.add('statictext', undefined, `${PRODUCT_DISPLAY_NAME} ${PRODUCT_VERSION}`)

    messages.forEach((message) => {
        const text = rootGroup.add('statictext', undefined, message, { multiline: true })
        text.alignment = ['fill', 'top']
    })

    const inspectButton = rootGroup.add('button', undefined, 'Inspect settings')
    inspectButton.onClick = function () {
        notify(`Current settings:\n${JSON.stringify(settings, null, 2)}`)
    }

    show(panel)
}
