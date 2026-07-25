import { spawnSync } from 'child_process'
import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
} from 'fs'
import { basename, dirname, extname, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
const verifyBuild = process.argv.includes('--build')
const failures = []

function fail(message) {
    failures.push(message)
}

function collectFiles(relativeDirectory, predicate) {
    const directory = join(projectRoot, relativeDirectory)
    const files = []

    if (!existsSync(directory)) return files

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const relativePath = join(relativeDirectory, entry.name)
        if (entry.isDirectory()) {
            files.push(...collectFiles(relativePath, predicate))
        } else if (entry.isFile() && predicate(entry.name)) {
            files.push(relativePath)
        }
    }

    return files
}

function collectJavaScriptFiles(relativeDirectory) {
    return collectFiles(relativeDirectory, (name) => extname(name) === '.js')
}

function validateSyntax(relativePath) {
    const result = spawnSync(process.execPath, ['--check', relativePath], {
        cwd: projectRoot,
        encoding: 'utf8',
    })

    if (result.status !== 0) {
        const details = result.stderr.trim() || (result.error && result.error.message) || ''
        fail(`${relativePath}: JavaScript syntax check failed${details ? `\n${details}` : ''}`)
    }
}

function resolveLocalImport(importer, specifier) {
    const cleanSpecifier = specifier.replace(/\?text$/, '')
    const unresolvedPath = resolve(projectRoot, dirname(importer), cleanSpecifier)
    const candidates = extname(unresolvedPath)
        ? [unresolvedPath]
        : [unresolvedPath, `${unresolvedPath}.js`, join(unresolvedPath, 'index.js')]

    return candidates.find((candidate) => existsSync(candidate))
}

function validateLocalImports(relativePath) {
    const source = readFileSync(join(projectRoot, relativePath), 'utf8')
    const importPattern = /(?:from\s+|import\s*)['"]([^'"]+)['"]/g
    let match = importPattern.exec(source)

    while (match) {
        const specifier = match[1]
        if (specifier.startsWith('.') && !resolveLocalImport(relativePath, specifier)) {
            fail(`${relativePath}: missing local import ${specifier}`)
        }
        match = importPattern.exec(source)
    }
}

function getEntryPoints() {
    const sourceDirectory = join(projectRoot, 'src')

    if (!existsSync(sourceDirectory)) return []

    return readdirSync(sourceDirectory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && extname(entry.name) === '.js')
        .map((entry) => join('src', entry.name))
        .sort()
}

function getExpectedArtifacts(entryPoints) {
    if (entryPoints.length === 1) {
        return [join('dist', `${packageJson.name}.jsx`)]
    }

    return entryPoints.map((entryPoint) => {
        const outputName = basename(entryPoint, extname(entryPoint))
        return join('dist', `${outputName}.jsx`)
    })
}

function validatePackageMetadata() {
    if (
        typeof packageJson.name !== 'string' ||
        !/^[a-z0-9][a-z0-9._-]*$/.test(packageJson.name)
    ) {
        fail('package.json: name must be a non-empty, filesystem-safe package name')
    }
    if (
        typeof packageJson.displayName !== 'string' ||
        packageJson.displayName.trim() === ''
    ) {
        fail('package.json: displayName must be a non-empty string')
    }
    if (typeof packageJson.version !== 'string' || packageJson.version.trim() === '') {
        fail('package.json: version must be a non-empty string')
    }
}

function validateRepository() {
    validatePackageMetadata()

    const requiredFiles = [
        '.gitmodules',
        'README.md',
        'songz-modules/ui.js',
        'src/main.js',
        'static/README.html',
    ]
    for (const relativePath of requiredFiles) {
        if (!existsSync(join(projectRoot, relativePath))) {
            fail(`missing required file: ${relativePath}`)
        }
    }

    const entryPoints = getEntryPoints()
    if (!entryPoints.length) {
        fail('src must contain at least one JavaScript entry point')
    }

    const sourceFiles = [
        ...collectJavaScriptFiles('src'),
        ...collectJavaScriptFiles('scripts'),
    ].sort()

    for (const relativePath of sourceFiles) {
        validateSyntax(relativePath)
        validateLocalImports(relativePath)
    }
}

function validateBuildArtifact(relativePath) {
    const artifactPath = join(projectRoot, relativePath)

    if (!existsSync(artifactPath)) {
        fail(`missing production artifact: ${relativePath}`)
        return
    }
    if (statSync(artifactPath).size === 0) {
        fail(`production artifact is empty: ${relativePath}`)
        return
    }

    const artifact = readFileSync(artifactPath, 'utf8')
    if (!artifact.includes('(function (thisObj) {') || !artifact.includes('})(this);')) {
        fail(`${relativePath}: missing the expected ExtendScript IIFE wrapper`)
    }
}

function validateStaticArtifacts() {
    const staticFiles = collectFiles('static', () => true)

    for (const sourcePath of staticFiles) {
        const outputPath = join('dist', relative('static', sourcePath))
        if (!existsSync(join(projectRoot, outputPath))) {
            fail(`production build did not copy ${sourcePath} to ${outputPath}`)
        }
    }
}

function validateBuild() {
    const entryPoints = getEntryPoints()

    for (const artifactPath of getExpectedArtifacts(entryPoints)) {
        validateBuildArtifact(artifactPath)
    }
    validateStaticArtifacts()
}

validateRepository()
if (verifyBuild) validateBuild()

if (failures.length) {
    for (const failure of failures) {
        process.stderr.write(`ERROR: ${failure}\n`)
    }
    process.exitCode = 1
} else {
    const scope = verifyBuild ? 'repository and production build' : 'repository'
    process.stdout.write(`Validated ${scope} successfully.\n`)
}
