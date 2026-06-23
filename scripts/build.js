import copyStaticFiles from 'esbuild-copy-static-files'
import babel from 'esbuild-plugin-babel'
import binaryString from './binary.js'
import textLoader from './text.js'
import { build } from 'esbuild'
import { join } from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import 'dotenv/config'

const entryPoints = glob.sync('src/*.js')
const devmode = process.env.NODE_ENV === 'development'
const outdir = devmode ? 'build' : 'dist'
const pkg = await fs.readJson('./package.json')
const productName = process.env.PRODUCT_NAME || pkg.name
const productDisplayName = process.env.PRODUCT_DISPLAY_NAME || pkg.displayName
const productVersion = process.env.PRODUCT_VERSION || pkg.version
const i18nLocale = process.env.I18N_LOCALE || ''
const out = entryPoints.length === 1 ? { outfile: join(outdir, `${productName}.jsx`) } : { outdir }
const define = {
    'DEVMODE': devmode,
    'PRODUCT_NAME': JSON.stringify(productName),
    'PRODUCT_DISPLAY_NAME': JSON.stringify(productDisplayName),
    'PRODUCT_VERSION': JSON.stringify(productVersion),
    'I18N_LOCALE': JSON.stringify(i18nLocale),
}

for (const key in process.env) {
    const invalid = key.includes('(x86)')
    if (!invalid) {
        define[key] = JSON.stringify(process.env[key])
    }
}

build({
    ...out,
    define,
    entryPoints,
    logLevel: 'info',
    bundle: true,
    sourcemap: devmode,
    target: ['es5'],
    // JSXBIN can fail when ExtendScript bundles are collapsed into one long line.
    minifyWhitespace: false,
    minifyIdentifiers: !devmode,
    outExtension: { '.js': '.jsx' },
    banner: {
        js: '(function (thisObj) {',
    },
    footer: {
        js: '})(this);',
    },
    plugins: [
        copyStaticFiles({ dest: outdir }),
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
