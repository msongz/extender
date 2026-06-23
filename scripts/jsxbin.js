import { renameSync, existsSync, rmSync, statSync } from 'fs'
import { readdir } from 'fs/promises'
import { spawn } from 'child_process'
import readdirp from 'readdirp'
import { homedir } from 'os'
import path from 'path'

const devmode = process.env.NODE_ENV === 'development'
const outdir = devmode ? 'build' : 'dist'

const curDir = path.resolve(outdir)
const foundScripts = await readdirp.promise(curDir, { fileFilter: '*.jsx' })
const scripts = foundScripts.map((f) => f.fullPath)
const exportJSXBin = await getExtensionPath()

for (const script of scripts) {
    await compileToJSXBin(exportJSXBin, script)
}

async function compileToJSXBin(exportJSXBin, script) {
    const compiledScript = `${script}bin`
    rmSync(compiledScript, { force: true })

    const output = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [exportJSXBin, '-f', '-n', script], {
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => { stdout += data })
        child.stderr.on('data', (data) => { stderr += data })
        child.on('error', reject)
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(stderr || stdout || `JSXBIN compiler exited with code ${code}`))
                return
            }
            resolve(`${stdout}${stderr}`)
        })
    })

    if (/JSX export failed/i.test(output) || !existsSync(compiledScript) || statSync(compiledScript).size === 0) {
        rmSync(compiledScript, { force: true })
        throw new Error(output.trim() || `JSXBIN compiler produced no output for ${script}`)
    }

    renameSync(compiledScript, script)
    process.stdout.write(output)
}

async function getExtensionPath() {
    const extensionsPath = path.join(homedir(), '.vscode', 'extensions')
    if (!existsSync(extensionsPath)) {
        throw new Error(`Missing VSCode extensions folder at ${extensionsPath}`)
    }
    const extensions = await readdir(extensionsPath)
    const extensionName = 'adobe.extendscript-debug'
    const extendscriptFolder = extensions.find((f) => f.includes(extensionName))
    if (!extendscriptFolder) {
        throw new Error(`Missing VSCode extension ${path.join(extensionsPath, extensionName)}`)
    }
    const jsxBinPath = path.join(extensionsPath, extendscriptFolder, 'public-scripts', 'exportToJSXBin.js')
    if (!existsSync(jsxBinPath)) {
        throw new Error(`Expected script at ${jsxBinPath}`)
    }
    return jsxBinPath
}
