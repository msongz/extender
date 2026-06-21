import { getAppVersionAsNumber } from '../../songz-modules/app.js'
import { openURL } from '../../songz-modules/songzUtils.js'
import { addWindow, colorGroup, show } from '../../songz-modules/ui.js'

function hexToRgb(hex) {
    const normalized = String(hex || '709536').replace('#', '')
    const color = normalized.length === 3
        ? normalized.replace(/(.)/g, '$1$1')
        : normalized

    return [
        parseInt(color.substr(0, 2), 16) / 255,
        parseInt(color.substr(2, 2), 16) / 255,
        parseInt(color.substr(4, 2), 16) / 255,
        1,
    ]
}

function getThemeColor() {
    if (getAppVersionAsNumber() < 25) return app.themeColor(3)

    switch (app.getAppTheme) {
        case 'light':
            return [234 / 255, 234 / 255, 234 / 255, 1]
        case 'dark':
            return [50 / 255, 50 / 255, 50 / 255, 1]
        case 'darkest':
            return [29 / 255, 29 / 255, 29 / 255, 1]
        default:
            return [29 / 255, 29 / 255, 29 / 255, 1]
    }
}

function setVisible(control, visible) {
    if (!control) return

    control.visible = visible
    if (visible) {
        if (control.show) control.show()
        control.preferredSize = [-1, -1]
        control.minimumSize = [0, 0]
        control.maximumSize = [10000, 10000]
    } else {
        if (control.hide) control.hide()
        control.preferredSize = [0, 0]
        control.minimumSize = [0, 0]
        control.maximumSize = [10000, 0]
    }
}

function scheduleRestore(callback, delay) {
    if (!app.scheduleTask) return

    if (!$.global._extenderTemplateRestores) {
        $.global._extenderTemplateRestores = {}
    }

    const id = `restore_${new Date().getTime()}_${Math.floor(Math.random() * 100000)}`
    $.global._extenderTemplateRestores[id] = function () {
        try {
            callback()
        } finally {
            try {
                delete $.global._extenderTemplateRestores[id]
            } catch (_error) {}
        }
    }

    app.scheduleTask(`$.global._extenderTemplateRestores["${id}"]()`, delay, false)
}

export function createTemplateFrame(thisObj, options = {}) {
    const title = options.title || PRODUCT_DISPLAY_NAME
    const versionText = options.versionText || `v${PRODUCT_VERSION}`
    const developerText = options.developerText || '@songz'
    const projectUrl = options.projectUrl || 'https://github.com/msongz/extender'
    const developerUrl = options.developerUrl || 'https://github.com/msongz'
    const borderColor = options.borderColor || hexToRgb(options.borderHex || '709536')
    const textColor = options.textColor || [1, 1, 1, 0.35]
    const statusDuration = options.statusDuration || 1600

    const win = addWindow({
        thisObj,
        titleName: title,
        orientation: 'column',
        alignChildren: ['fill', 'fill'],
        margins: 0,
        spacing: 0,
        resizeable: true,
    })

    if (!win) return null

    const borderGroup = win.add('group')
    borderGroup.orientation = 'column'
    borderGroup.alignment = ['fill', 'fill']
    borderGroup.margins = options.borderWidth !== undefined ? options.borderWidth : 6
    borderGroup.spacing = 0
    borderGroup.graphics.backgroundColor = borderGroup.graphics.newBrush(
        borderGroup.graphics.BrushType.SOLID_COLOR,
        borderColor,
    )

    const contentGroup = borderGroup.add('group')
    contentGroup.orientation = 'column'
    contentGroup.alignment = ['fill', 'fill']
    contentGroup.alignChildren = ['fill', 'top']
    contentGroup.margins = options.contentMargins !== undefined ? options.contentMargins : 8
    contentGroup.spacing = options.contentSpacing !== undefined ? options.contentSpacing : 8
    colorGroup(contentGroup, getThemeColor())

    const viewGroup = contentGroup.add('group')
    viewGroup.orientation = 'stack'
    viewGroup.alignment = ['fill', 'fill']
    viewGroup.alignChildren = ['fill', 'top']
    viewGroup.margins = 0
    viewGroup.spacing = 0

    const homeGroup = viewGroup.add('group')
    homeGroup.orientation = 'column'
    homeGroup.alignment = ['fill', 'top']
    homeGroup.alignChildren = ['fill', 'top']
    homeGroup.margins = 0
    homeGroup.spacing = 8

    const settingsGroup = viewGroup.add('group')
    settingsGroup.orientation = 'column'
    settingsGroup.alignment = ['fill', 'top']
    settingsGroup.alignChildren = ['fill', 'top']
    settingsGroup.margins = 0
    settingsGroup.spacing = 8

    const settingsTitle = settingsGroup.add('statictext', undefined, options.settingsTitle || 'Settings')
    settingsTitle.alignment = ['fill', 'top']

    const bottomGroup = contentGroup.add('group')
    bottomGroup.orientation = 'row'
    bottomGroup.alignment = ['fill', 'bottom']
    bottomGroup.alignChildren = ['left', 'center']
    bottomGroup.margins = 0
    bottomGroup.spacing = 6

    const versionInfo = bottomGroup.add('statictext', undefined, versionText)
    versionInfo.alignment = ['left', 'center']
    versionInfo.helpTip = options.versionHelpTip || 'Open project page'

    const developerInfo = bottomGroup.add('statictext', undefined, developerText)
    developerInfo.alignment = ['left', 'center']
    developerInfo.helpTip = options.developerHelpTip || 'Open developer page'
    developerInfo.hide()

    const bottomSpacer = bottomGroup.add('statictext', undefined, '')
    bottomSpacer.alignment = ['fill', 'center']

    const settingsButton = bottomGroup.add('button', undefined, options.settingsButtonText || 'Settings')
    settingsButton.alignment = ['right', 'center']
    settingsButton.helpTip = options.settingsHelpTip || 'Toggle settings'
    settingsButton.preferredSize = [78, 22]

    const textPen = versionInfo.graphics.newPen(
        versionInfo.graphics.PenType.SOLID_COLOR,
        textColor,
        1,
    )
    const highlightPen = versionInfo.graphics.newPen(
        versionInfo.graphics.PenType.SOLID_COLOR,
        borderColor,
        1,
    )

    let statusToken = 0
    let settingsVisible = false
    let homeMinimumSize = null

    function setFooterPen(pen) {
        versionInfo.graphics.foregroundColor = pen
        developerInfo.graphics.foregroundColor = pen
    }

    function restoreVersionInfo() {
        versionInfo.text = versionText
        setFooterPen(textPen)
    }

    function relayout() {
        try {
            win.layout.layout(true)
            win.layout.resize()
            if (win.update) win.update()
        } catch (_error) {}
    }

    function captureHomeMinimumSize() {
        if (settingsVisible || !homeGroup.visible) return

        try {
            win.layout.layout(true)
            const size = borderGroup.preferredSize || borderGroup.size
            if (!size || size.length < 2 || size[0] <= 0 || size[1] <= 0) return

            homeMinimumSize = [size[0], size[1]]
            win.minimumSize = homeMinimumSize
            borderGroup.minimumSize = homeMinimumSize
        } catch (_error) {}
    }

    function showSettings(visible) {
        settingsVisible = visible
        setVisible(settingsGroup, visible)
        setVisible(homeGroup, !visible)
        settingsButton.text = visible ? (options.backButtonText || 'Back') : (options.settingsButtonText || 'Settings')
        if (!visible && homeMinimumSize) {
            win.minimumSize = homeMinimumSize
            borderGroup.minimumSize = homeMinimumSize
        }
        relayout()
    }

    function setVersionInfo(text, color) {
        versionInfo.text = text
        versionInfo.graphics.foregroundColor = versionInfo.graphics.newPen(
            versionInfo.graphics.PenType.SOLID_COLOR,
            color || borderColor,
            1,
        )
    }

    function flashVersionInfo(text, duration, color) {
        statusToken += 1
        const token = statusToken
        setVersionInfo(text, color)
        scheduleRestore(function () {
            if (token === statusToken) restoreVersionInfo()
        }, duration || statusDuration)
    }

    function openProjectPage() {
        openURL(projectUrl)
    }

    function openDeveloperPage() {
        openURL(developerUrl)
    }

    versionInfo.graphics.foregroundColor = textPen
    developerInfo.graphics.foregroundColor = textPen

    versionInfo.addEventListener('mouseover', function () {
        versionInfo.graphics.foregroundColor = highlightPen
        developerInfo.show()
        relayout()
    })
    versionInfo.addEventListener('mouseout', function () {
        restoreVersionInfo()
        developerInfo.hide()
        relayout()
    })
    versionInfo.addEventListener('click', openProjectPage)

    developerInfo.addEventListener('mouseover', function () {
        developerInfo.graphics.foregroundColor = highlightPen
    })
    developerInfo.addEventListener('mouseout', function () {
        developerInfo.graphics.foregroundColor = textPen
    })
    developerInfo.addEventListener('click', openDeveloperPage)

    settingsButton.onClick = function () {
        showSettings(!settingsVisible)
    }

    showSettings(false)

    return {
        win,
        borderGroup,
        borderColor,
        contentGroup,
        viewGroup,
        homeGroup,
        settingsGroup,
        settingsTitle,
        bottomGroup,
        versionInfo,
        developerInfo,
        settingsButton,
        showSettings,
        restoreVersionInfo,
        setVersionInfo,
        flashVersionInfo,
        openProjectPage,
        openDeveloperPage,
        relayout,
        show: function () {
            show(win)
            relayout()
            captureHomeMinimumSize()
            relayout()
        },
    }
}
