/// <reference types="types-for-adobe/AfterEffects/18.0"/>
/// <reference types="types-for-adobe/shared/ScriptUI"/>

import { notify } from './modules/utils.js'
import { createTemplateFrame } from './modules/templateFrame.js'
import { loadPref, prefKeys, savePref } from './modules/preferences.js'
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
let footerMessage = loadPref(prefKeys.footerMessage, 'Template status ready')

const frame = createTemplateFrame(thisObj, {
    title: PRODUCT_DISPLAY_NAME,
    versionText: `v${PRODUCT_VERSION}`,
    developerText: '@songz',
    projectUrl: 'https://github.com/msongz/extender',
    developerUrl: 'https://github.com/msongz',
    borderHex: '709536',
})

if (frame) {
    const header = frame.homeGroup.add('group')
    header.orientation = 'row'
    header.alignChildren = ['left', 'center']

    header.add('iconbutton', undefined, File.decode(icon))
    header.add('statictext', undefined, `${PRODUCT_DISPLAY_NAME} ${PRODUCT_VERSION}`)

    messages.forEach((message) => {
        const text = frame.homeGroup.add('statictext', undefined, message, { multiline: true })
        text.alignment = ['fill', 'top']
    })

    const actionGroup = frame.homeGroup.add('group')
    actionGroup.orientation = 'row'
    actionGroup.alignment = ['fill', 'top']
    actionGroup.alignChildren = ['fill', 'center']
    actionGroup.spacing = 6

    const inspectButton = actionGroup.add('button', undefined, 'Inspect settings')
    inspectButton.onClick = function () {
        notify(`Current settings:\n${JSON.stringify(settings, null, 2)}`)
    }

    const statusButton = actionGroup.add('button', undefined, 'Flash footer')
    statusButton.onClick = function () {
        frame.flashVersionInfo(footerMessage)
    }

    const linkButton = frame.homeGroup.add('button', undefined, 'Open project page')
    linkButton.onClick = frame.openProjectPage

    const footerRow = frame.settingsGroup.add('group')
    footerRow.orientation = 'row'
    footerRow.alignment = ['fill', 'top']
    footerRow.alignChildren = ['fill', 'center']
    footerRow.spacing = 6

    footerRow.add('statictext', undefined, 'Footer message')
    const footerMessageInput = footerRow.add('edittext', undefined, footerMessage)
    footerMessageInput.alignment = ['fill', 'center']

    const settingsActionGroup = frame.settingsGroup.add('group')
    settingsActionGroup.orientation = 'row'
    settingsActionGroup.alignment = ['fill', 'top']
    settingsActionGroup.alignChildren = ['fill', 'center']
    settingsActionGroup.spacing = 6

    const previewFooterButton = settingsActionGroup.add('button', undefined, 'Preview footer')
    previewFooterButton.onClick = function () {
        footerMessage = footerMessageInput.text
        savePref(prefKeys.footerMessage, footerMessageInput.text)
        frame.flashVersionInfo(footerMessageInput.text)
    }

    const openDeveloperButton = settingsActionGroup.add('button', undefined, 'Open developer page')
    openDeveloperButton.onClick = frame.openDeveloperPage

    frame.show()
}
