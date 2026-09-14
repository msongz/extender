import { showThemedDialog } from '../../../songz-modules/dialog.js'
import { t } from '../i18n.js'
import { prefKeys, savePref } from '../preferences.js'
import { scheduleRestore } from '../../../songz-modules/songzUtils.js'

let inspectPending = false

export function inspectSettings(settings, frame, onDialogClosed) {
    if (inspectPending) return
    inspectPending = true

    function openDialog() {
        try {
            // Docked Panel bounds are local coordinates, not screen coordinates.
            const parentWindow = frame && frame.win instanceof Window ? frame.win : undefined
            showThemedDialog({
                message: `${PRODUCT_DISPLAY_NAME} ${PRODUCT_VERSION}\nCurrent settings:\n${JSON.stringify(settings, null, 2)}`,
                iconType: 'info',
                themeColor: frame ? frame.borderColor : undefined,
                parentWindow,
                position: parentWindow ? 'window' : 'screen',
                messageAlignment: 'left',
                defaultValue: true,
                buttons: [
                    {
                        text: t('dialog.okButton'),
                        value: true,
                        themed: true,
                        default: true,
                        minimumSize: [96, 30],
                    },
                ],
            })
        } finally {
            inspectPending = false
            if (onDialogClosed) onDialogClosed()
        }
    }

    try {
        // Release the themed button's mouseup event before entering a modal loop.
        if (app.scheduleTask) scheduleRestore(openDialog, 100)
        else openDialog()
    } catch (error) {
        inspectPending = false
        throw error
    }
}

export function updateFooterMessage(frame, state, value) {
    state.footerMessage = value
    savePref(prefKeys.footerMessage, value)
    frame.flashVersionInfo(value)
}
