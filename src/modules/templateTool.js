import { createTemplateFrame } from './templateFrame.js'
import { frameOptions, getHomeMessages, toolSettings } from './templateTool/config.js'
import { createTemplateToolState } from './templateTool/state.js'
import { buildHomeView, buildSettingsView } from './templateTool/views.js'

export function startTemplateTool(thisObj) {
    const frame = createTemplateFrame(thisObj, frameOptions)
    if (!frame) return

    const context = {
        homeMessages: getHomeMessages(),
        state: createTemplateToolState(),
        toolSettings,
    }

    buildHomeView(frame, context)
    buildSettingsView(frame, context)
    frame.show()
}
