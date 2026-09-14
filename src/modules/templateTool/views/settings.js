import { updateFooterMessage } from '../actions.js'
import { addButton, addEditText, addGroup, addStaticText } from '../../../../songz-modules/ui.js'

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
