import { showThemedDialog } from '../../songz-modules/dialog.js'
import { t } from './i18n.js'

export function notify(msg, options = {}) {
    return showThemedDialog({
        message: `${PRODUCT_DISPLAY_NAME} ${PRODUCT_VERSION}\n${msg}`,
        iconType: 'info',
        defaultValue: true,
        buttons: [
            {
                text: options.okText || t('dialog.okButton'),
                value: true,
                themed: true,
                default: true,
                minimumSize: [96, 30],
            },
        ],
        ...options,
    })
}
