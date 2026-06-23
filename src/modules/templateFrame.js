import { openURL, scheduleRestore } from '../../songz-modules/songzUtils.js'
import {
    addMouseOutEvent,
    addMouseOverEvent,
    addOnClickEvent,
    addButton,
    addGroup,
    addStaticText,
    addWindow,
    colorBgGroup,
    hexToScriptUIColor,
    layout,
    resize,
    setVisible,
    show,
} from '../../songz-modules/ui.js'
import { t } from './i18n.js'

function normalizeFrameOptions(options = {}) {
    return {
        title: options.title || PRODUCT_DISPLAY_NAME,
        versionText: options.versionText || `v${PRODUCT_VERSION}`,
        developerText: options.developerText || '@songz',
        projectUrl: options.projectUrl || 'https://github.com/msongz/extender',
        developerUrl: options.developerUrl || 'https://github.com/msongz',
        borderColor: options.borderColor || hexToScriptUIColor(options.borderHex || '709536'),
        textColor: options.textColor || [1, 1, 1, 0.35],
        statusDuration: options.statusDuration || 1600,
        borderWidth: options.borderWidth !== undefined ? options.borderWidth : 6,
        contentMargins: options.contentMargins !== undefined ? options.contentMargins : 8,
        contentSpacing: options.contentSpacing !== undefined ? options.contentSpacing : 8,
        settingsTitle: options.settingsTitle || t('frame.settingsTitle'),
        settingsButtonText: options.settingsButtonText || t('frame.settingsButton'),
        backButtonText: options.backButtonText || t('frame.backButton'),
        settingsHelpTip: options.settingsHelpTip || t('frame.settingsHelpTip'),
        versionHelpTip: options.versionHelpTip || t('frame.versionHelpTip'),
        developerHelpTip: options.developerHelpTip || t('frame.developerHelpTip'),
    }
}

function createFrameWindow(thisObj, config) {
    return addWindow({
        thisObj,
        titleName: config.title,
        orientation: 'column',
        alignChildren: ['fill', 'fill'],
        margins: 0,
        spacing: 0,
        resizeable: true,
    })
}

function createFrameShell(win, config) {
    const borderGroup = addGroup(win, {
        orientation: 'column',
        margins: config.borderWidth,
    })
    borderGroup.graphics.backgroundColor = borderGroup.graphics.newBrush(
        borderGroup.graphics.BrushType.SOLID_COLOR,
        config.borderColor,
    )

    const contentGroup = addGroup(borderGroup, {
        orientation: 'column',
        alignChildren: ['fill', 'top'],
        margins: config.contentMargins,
        spacing: config.contentSpacing,
    })
    colorBgGroup(contentGroup)

    const viewGroup = addGroup(contentGroup, {
        orientation: 'stack',
        alignment: ['fill', 'fill'],
        alignChildren: ['fill', 'top'],
    })

    const homeGroup = addGroup(viewGroup, {
        orientation: 'column',
        alignment: ['fill', 'fill'],
        alignChildren: ['fill', 'top'],
        spacing: 8,
    })

    const settingsGroup = addGroup(viewGroup, {
        orientation: 'column',
        alignment: ['fill', 'top'],
        alignChildren: ['fill', 'top'],
        spacing: 8,
    })

    const settingsTitle = addStaticText(settingsGroup, {
        text: config.settingsTitle,
        alignment: ['fill', 'top'],
    })

    return {
        borderGroup,
        contentGroup,
        viewGroup,
        homeGroup,
        settingsGroup,
        settingsTitle,
    }
}

function createFrameFooter(contentGroup, config) {
    const bottomGroup = addGroup(contentGroup, {
        alignment: ['fill', 'bottom'],
        alignChildren: ['left', 'center'],
        spacing: 6,
    })

    const versionInfo = addStaticText(bottomGroup, {
        text: config.versionText,
        alignment: ['fill', 'center'],
        helpTip: config.versionHelpTip,
    })

    const developerInfo = addStaticText(bottomGroup, {
        text: config.developerText,
        alignment: ['right', 'center'],
        helpTip: config.developerHelpTip,
    })
    developerInfo.hide()

    const settingsButton = addButton(bottomGroup, {
        text: config.settingsButtonText,
        alignment: ['right', 'center'],
        helpTip: config.settingsHelpTip,
        preferredSize: [78, 22],
    })

    const textPen = versionInfo.graphics.newPen(
        versionInfo.graphics.PenType.SOLID_COLOR,
        config.textColor,
        1,
    )
    const highlightPen = versionInfo.graphics.newPen(
        versionInfo.graphics.PenType.SOLID_COLOR,
        config.borderColor,
        1,
    )

    versionInfo.graphics.foregroundColor = textPen
    developerInfo.graphics.foregroundColor = textPen

    return {
        bottomGroup,
        versionInfo,
        developerInfo,
        settingsButton,
        textPen,
        highlightPen,
    }
}

function createFooterController(footer, config) {
    let statusToken = 0

    function setFooterPen(pen) {
        footer.versionInfo.graphics.foregroundColor = pen
        footer.developerInfo.graphics.foregroundColor = pen
    }

    function restoreVersionInfo() {
        footer.versionInfo.text = config.versionText
        setFooterPen(footer.textPen)
    }

    function setVersionInfo(text, color) {
        footer.versionInfo.text = text
        footer.versionInfo.graphics.foregroundColor = footer.versionInfo.graphics.newPen(
            footer.versionInfo.graphics.PenType.SOLID_COLOR,
            color || config.borderColor,
            1,
        )
    }

    function flashVersionInfo(text, duration, color) {
        statusToken += 1
        const token = statusToken
        setVersionInfo(text, color)
        scheduleRestore(function () {
            if (token === statusToken) restoreVersionInfo()
        }, duration || config.statusDuration)
    }

    function openProjectPage() {
        openURL(config.projectUrl)
    }

    function openDeveloperPage() {
        openURL(config.developerUrl)
    }

    return {
        restoreVersionInfo,
        setVersionInfo,
        flashVersionInfo,
        openProjectPage,
        openDeveloperPage,
    }
}

function createViewController(win, shell, footer, config) {
    let settingsVisible = false
    let fixedMinimumSize = null
    let isManagingViewSize = false
    const viewSizes = {
        home: null,
        settings: null,
    }

    function relayout() {
        try {
            layout(win)
            resize(win)
            if (win.update) win.update()
        } catch (_error) {}
    }

    function getCurrentViewKey() {
        return settingsVisible ? 'settings' : 'home'
    }

    function getWindowSize() {
        try {
            const size = win.size
            if (!size || size.length < 2 || size[0] <= 0 || size[1] <= 0) return null

            return [size[0], size[1]]
        } catch (_error) {
            return null
        }
    }

    function rememberCurrentViewSize() {
        if (isManagingViewSize) return

        const size = getWindowSize()
        if (!size) return

        viewSizes[getCurrentViewKey()] = size
    }

    function restoreViewSize(viewKey) {
        const size = viewSizes[viewKey]
        if (!size) return false

        const wasManagingViewSize = isManagingViewSize
        try {
            isManagingViewSize = true
            layout(win)
            win.size = [size[0], size[1]]
            resize(win)
            win.size = [size[0], size[1]]
            if (win.update) win.update()
            return true
        } catch (_error) {
            return false
        } finally {
            isManagingViewSize = wasManagingViewSize
        }
    }

    function setVisibleView(visible) {
        setVisible(shell.settingsGroup, visible)
        setVisible(shell.homeGroup, !visible)
        footer.settingsButton.text = visible ? config.backButtonText : config.settingsButtonText
    }

    function clearMinimumSize() {
        win.minimumSize = [0, 0]
        shell.borderGroup.minimumSize = [0, 0]
    }

    function applyFixedMinimumSize() {
        if (!fixedMinimumSize) return

        win.minimumSize = [fixedMinimumSize[0], fixedMinimumSize[1]]
        shell.borderGroup.minimumSize = [fixedMinimumSize[0], fixedMinimumSize[1]]
    }

    function captureCurrentMinimumSize() {
        try {
            const size = shell.borderGroup.preferredSize || shell.borderGroup.size
            if (!size || size.length < 2 || size[0] <= 0 || size[1] <= 0) return null

            return [size[0], size[1]]
        } catch (_error) {
            return null
        }
    }

    function initializeMinimumSize() {
        if (fixedMinimumSize) {
            applyFixedMinimumSize()
            return
        }

        clearMinimumSize()
        relayout()
        fixedMinimumSize = captureCurrentMinimumSize()
        applyFixedMinimumSize()
        viewSizes.home = getWindowSize()
        relayout()
    }

    function initializeViewSizes() {
        if (!fixedMinimumSize) return

        try {
            isManagingViewSize = true

            viewSizes.home = getWindowSize() || viewSizes.home

            setVisibleView(true)
            applyFixedMinimumSize()
            relayout()
            viewSizes.settings = getWindowSize()

            setVisibleView(false)
            applyFixedMinimumSize()
            if (!restoreViewSize('home')) relayout()
            settingsVisible = false
        } finally {
            isManagingViewSize = false
        }
    }

    function showSettings(visible) {
        const viewKey = visible ? 'settings' : 'home'
        if (fixedMinimumSize && settingsVisible !== visible) {
            rememberCurrentViewSize()
        }

        settingsVisible = visible
        setVisibleView(visible)
        applyFixedMinimumSize()
        if (!restoreViewSize(viewKey)) relayout()
    }

    function isSettingsVisible() {
        return settingsVisible
    }

    return {
        initializeMinimumSize,
        initializeViewSizes,
        isSettingsVisible,
        rememberCurrentViewSize,
        relayout,
        showSettings,
    }
}

function bindFrameEvents(win, footer, viewController, footerController) {
    addMouseOverEvent(footer.versionInfo, function () {
        footer.versionInfo.graphics.foregroundColor = footer.highlightPen
        footer.developerInfo.show()
    })
    addMouseOutEvent(footer.versionInfo, function () {
        footerController.restoreVersionInfo()
        footer.developerInfo.hide()
    })
    addOnClickEvent(footer.versionInfo, footerController.openProjectPage)

    addMouseOverEvent(footer.developerInfo, function () {
        footer.developerInfo.graphics.foregroundColor = footer.highlightPen
    })
    addMouseOutEvent(footer.developerInfo, function () {
        footer.developerInfo.graphics.foregroundColor = footer.textPen
    })
    addOnClickEvent(footer.developerInfo, footerController.openDeveloperPage)

    footer.settingsButton.onClick = function () {
        viewController.showSettings(!viewController.isSettingsVisible())
    }

    const originalOnResize = win.onResize
    const originalOnResizing = win.onResizing
    win.onResize = function () {
        viewController.rememberCurrentViewSize()
        if (originalOnResize) originalOnResize()
    }
    win.onResizing = function () {
        viewController.rememberCurrentViewSize()
        if (originalOnResizing) originalOnResizing()
    }
}

export function createTemplateFrame(thisObj, options = {}) {
    const config = normalizeFrameOptions(options)
    const win = createFrameWindow(thisObj, config)

    if (!win) return null

    const shell = createFrameShell(win, config)
    const footer = createFrameFooter(shell.contentGroup, config)
    const footerController = createFooterController(footer, config)
    const viewController = createViewController(win, shell, footer, config)

    bindFrameEvents(win, footer, viewController, footerController)
    viewController.showSettings(false)

    return {
        win,
        borderGroup: shell.borderGroup,
        borderColor: config.borderColor,
        contentGroup: shell.contentGroup,
        viewGroup: shell.viewGroup,
        homeGroup: shell.homeGroup,
        settingsGroup: shell.settingsGroup,
        settingsTitle: shell.settingsTitle,
        bottomGroup: footer.bottomGroup,
        versionInfo: footer.versionInfo,
        developerInfo: footer.developerInfo,
        settingsButton: footer.settingsButton,
        showSettings: viewController.showSettings,
        restoreVersionInfo: footerController.restoreVersionInfo,
        setVersionInfo: footerController.setVersionInfo,
        flashVersionInfo: footerController.flashVersionInfo,
        openProjectPage: footerController.openProjectPage,
        openDeveloperPage: footerController.openDeveloperPage,
        relayout: viewController.relayout,
        show: function () {
            show(win)
            viewController.initializeMinimumSize()
            viewController.initializeViewSizes()
        },
    }
}
