import icon from '../../icons/icon.png'
import { inspectSettings, updateFooterMessage } from './actions.js'
import { addButton, addEditText, addGroup, addStaticText } from '../../../songz-modules/ui.js'

// Home view: replace this with the main controls for a new script.
export function buildHomeView(frame, context) {
    const header = addGroup(frame.homeGroup, {
        alignChildren: ['left', 'center'],
    })

    header.add('iconbutton', undefined, File.decode(icon))
    addStaticText(header, {
        text: `${PRODUCT_DISPLAY_NAME} ${PRODUCT_VERSION}`,
        alignment: ['left', 'center'],
    })

    context.homeMessages.forEach((message) => {
        addStaticText(frame.homeGroup, {
            text: message,
            multiline: true,
            alignment: ['fill', 'top'],
        })
    })

    const actionGroup = addGroup(frame.homeGroup, {
        alignment: ['fill', 'top'],
        alignChildren: ['fill', 'center'],
        spacing: 6,
    })

    addButton(actionGroup, {
        text: 'Inspect settings',
        onClick: function () {
            inspectSettings(context.toolSettings)
        },
    })

    addButton(actionGroup, {
        text: 'Flash footer',
        onClick: function () {
            frame.flashVersionInfo(context.state.footerMessage)
        },
    })

    addButton(frame.homeGroup, {
        text: 'Open project page',
        onClick: frame.openProjectPage,
    })
}

// Settings view: put preferences and secondary controls here.
export function buildSettingsView(frame, context) {
    const footerRow = addGroup(frame.settingsGroup, {
        alignment: ['fill', 'top'],
        alignChildren: ['fill', 'center'],
        spacing: 6,
    })

    addStaticText(footerRow, {
        text: 'Footer message',
        alignment: ['left', 'center'],
    })
    const footerMessageInput = addEditText(footerRow, {
        text: context.state.footerMessage,
        justify: 'left',
        alignment: ['fill', 'center'],
    })

    const settingsActionGroup = addGroup(frame.settingsGroup, {
        orientation: 'column',
        alignment: ['fill', 'top'],
        alignChildren: ['fill', 'top'],
        spacing: 6,
    })

    addButton(settingsActionGroup, {
        text: 'Preview footer',
        alignment: ['fill', 'top'],
        onClick: () => updateFooterMessage(frame, context.state, footerMessageInput.text),
    })

    addButton(settingsActionGroup, {
        text: 'Open developer page',
        alignment: ['fill', 'top'],
        onClick: frame.openDeveloperPage,
    })
}
