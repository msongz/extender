import copyStaticFiles from 'esbuild-copy-static-files'
import babel from 'esbuild-plugin-babel'
import binaryString from './binary.js'
import textLoader from './text.js'
import { build } from 'esbuild'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import glob from 'glob'
import dotenv from 'dotenv'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const entryPoints = glob.sync(join(projectRoot, 'src/*.js').replace(/\\/g, '/'))
const projectEnv = dotenv.config({ path: join(projectRoot, '.env') }).parsed || {}
const devmode = process.env.NODE_ENV === 'development'
const outdir = join(projectRoot, devmode ? 'build' : 'dist')
const pkg = await fs.readJson(join(projectRoot, 'package.json'))
const normalizePackageAuthor = (author) => {
    if (!author) return ''
    if (typeof author === 'string') return author
    return author.name || ''
}
const productName = process.env.PRODUCT_NAME || pkg.name
const productDisplayName = process.env.PRODUCT_DISPLAY_NAME || pkg.displayName
const productVersion = process.env.PRODUCT_VERSION || pkg.displayVersion || pkg.version
const productDeveloper = process.env.PRODUCT_DEVELOPER || normalizePackageAuthor(pkg.author)
const i18nLocale = process.env.I18N_LOCALE || ''
const out = entryPoints.length === 1 ? { outfile: join(outdir, `${productName}.jsx`) } : { outdir }
const define = {
    'DEVMODE': JSON.stringify(devmode),
    'PRODUCT_NAME': JSON.stringify(productName),
    'PRODUCT_DISPLAY_NAME': JSON.stringify(productDisplayName),
    'PRODUCT_VERSION': JSON.stringify(productVersion),
    'PRODUCT_DEVELOPER': JSON.stringify(productDeveloper),
    'I18N_LOCALE': JSON.stringify(i18nLocale),
}

for (const key of Object.keys(projectEnv)) {
    // Only expose variables declared by this project. Passing the complete
    // host environment to esbuild can accidentally replace ordinary source
    // identifiers such as PATH, TEMP, or USERNAME.
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
        const value = JSON.stringify(process.env[key])
        if (value !== undefined && define[key] === undefined) define[key] = value
    }
}

await build({
    ...out,
    define,
    entryPoints,
    absWorkingDir: projectRoot,
    tsconfig: join(projectRoot, 'scripts/tsconfig.build.json'),
    logLevel: 'info',
    // babel-preset-extendscript's JSON ponyfill intentionally retains a
    // future-facing `typeof value === "null"` case. Silence only that known
    // upstream diagnostic while keeping every other esbuild warning visible.
    logOverride: { 'impossible-typeof': 'silent' },
    bundle: true,
    sourcemap: devmode,
    target: ['es5'],
    // Adobe's JSXBIN compiler can fail on esbuild's aggressively minified
    // output, even though the equivalent formatted ES5 is valid ExtendScript.
    minify: false,
    outExtension: { '.js': '.jsx' },
    banner: {
        js: '(function (thisObj) {',
    },
    footer: {
        js: '})(this);',
    },
    plugins: [
        copyStaticFiles({ src: join(projectRoot, 'static'), dest: outdir }),
        binaryString(),
        textLoader(),
        babel({
            config: {
                presets: [
                    ['extendscript', { modules: false }]
                ]
            }
        }),
    ],
    watch: devmode && {
        onRebuild(error) {
            if (error) console.error(error)
        },
    }
})
