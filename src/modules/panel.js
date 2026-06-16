export function createPanel(thisObj, title, options = {}) {
    const win =
        thisObj instanceof Panel
            ? thisObj
            : new Window(options.type || 'palette', title, undefined, {
                  resizeable: options.resizeable !== undefined ? options.resizeable : true,
              })

    if (!win) return null

    win.text = title
    win.orientation = options.orientation || 'column'
    win.alignChildren = options.alignChildren || ['fill', 'top']
    win.spacing = options.spacing !== undefined ? options.spacing : 8
    win.margins = options.margins !== undefined ? options.margins : 12

    win.onResize = win.onResizing = function () {
        if (win.layout) win.layout.resize()
    }

    return win
}

export function showPanel(win) {
    if (!win) return

    if (win instanceof Window) {
        win.center()
        win.show()
        return
    }

    win.layout.layout(true)
    win.layout.resize()
}
