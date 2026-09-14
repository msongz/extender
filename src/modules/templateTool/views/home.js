import icon from '../../../icons/icon.png'
import { inspectSettings } from '../actions.js'
import { addThemedButton, addGroup, addStaticText } from '../../../../songz-modules/ui.js'

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

    const inspectButton = addThemedButton(actionGroup, {
        themeColor: frame.borderColor,
        text: 'Inspect settings',
        onClick: function () {
            inspectSettings(context.toolSettings, frame, function () {
                inspectButton.setEnabled(inspectButton.enabled)
                // Invalidate the native label as well as the owner-drawn background.
                // No layout pass is needed, so the panel keeps its current size.
                if (inspectButton.visible) {
                    inspectButton.hide()
                    inspectButton.show()
                }
                if (frame.win.update) frame.win.update()
            })
        },
    })

    addThemedButton(actionGroup, {
        themeColor: frame.borderColor,
        text: 'Flash footer',
        onClick: function () {
            frame.flashVersionInfo(context.state.footerMessage)
        },
    })

    addThemedButton(frame.homeGroup, {
        themeColor: frame.borderColor,
        text: 'Open project page',
        onClick: frame.openProjectPage,
    })
}
