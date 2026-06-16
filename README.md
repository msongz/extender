# extender

A modern starter for writing Adobe Extendscript

_(yes, another one)_

## Why?

Writing Extendscript (Ecmascript 3) is rather annoying once you're used to modern Javascript. You expect to use array methods and common practices such as `.env` files, no-nonsense bundling, rebuilding on changes, etc.

Other starters don't actually transform modern Javascript, so you have to write helper functions for your beloved array methods which totally defeats the point of writing modern Javascript. You might polyfill them, but that pollutes the global scope _(which is bad for everyone if you found a shitty implementation on Stack Overflow)._

## Features

- Modern Javascript with [ponyfills](https://github.com/sindresorhus/ponyfill#how-are-ponyfills-better-than-polyfills) (see [babel-preset-extendscript](https://github.com/fusepilot/babel-preset-extendscript))
- Ecmascript modules for importing and exporting
- Fast bundling with [esbuild](https://github.com/evanw/esbuild) _(TODO: insert obligatory lightning bolt emoji)_
- Rebundles on file changes
- Shortens release identifiers while keeping JSXBIN-safe whitespace
- Converts to binary with [extendscript-debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug)
- Wraps bundle in an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) to avoid global variables and expose Adobe's `thisObj` for dockable ScriptUI panels
- Exposes environment variables to Javascript files
- Includes JSON automatically as a ponyfill
- Copies static files from `/static` (with [esbuild-copy-static-files](https://github.com/nickjj/esbuild-copy-static-files))
- Imports `?text` suffixed paths as strings
- Imports icons as binary strings
- Includes the `msongz/songz-modules` submodule for reusable After Effects helpers

## Try the example

1. Duplicate `.env.example` and remove the `.example` extension
1. Run `git submodule update --init --recursive`
1. Run `npm install && npm start` in your terminal
1. Run `/build/extender.jsx` in your Adobe app of choice

## Development

```
npm install && npm start
```

This will start watching your source files and builds into the `build` folder.

## Release

```
npm run release
```

This will bundle, minify and jsxbin your source files into the `dist` folder.

## Environment Variables

All variables are replaced by their values upon bundling.

By default the bundler exposes:

- `DEVMODE` when `NODE_ENV` is `development` or not,
- `PRODUCT_NAME` which is `name` from `package.json`,
- `PRODUCT_DISPLAY_NAME` which is `displayName` from `package.json` and
- `PRODUCT_VERSION` which is `version` from `package.json`

If you have a `.env` file it will automatically expose the variables by their name to all Javascript files.

## Entrypoints

Every `.js` file in the root of the `src/` folder is considered an entrypoint. Multiple entrypoints will result in multiple scripts being bundled separately, keeping the same name as their entrypoint. If there's a single entrypoint it will be renamed to `name` from `package.json`.

## Dockable ScriptUI Panels

The build wraps each bundle with `(function (thisObj) { ... })(this);`, so entrypoints can pass `thisObj` into panel helpers. The example in [src/main.js](./src/main.js#L10) uses `addWindow` from [songz-modules/ui.js](./songz-modules/ui.js) to open as a dockable panel when installed from the ScriptUI Panels folder, while still falling back to a floating palette when run directly.

For larger After Effects tools, import shared helpers from `songz-modules`:

```js
import { addWindow, show } from '../songz-modules/ui'
```

## Template Window Frame

[src/modules/templateFrame.js](./src/modules/templateFrame.js) provides a reusable ScriptUI shell inspired by segmentRender:

- colored outer border and themed content background
- `homeGroup` and `settingsGroup` views with a footer Settings/Back toggle
- footer version text, developer text, hover highlight, and click-to-open links
- `flashVersionInfo()` for temporary status/version text overrides
- `openProjectPage()` and `openDeveloperPage()` helpers

The example [src/main.js](./src/main.js) shows how future tools can put product controls in `frame.homeGroup`, settings controls in `frame.settingsGroup`, and then call `frame.show()`.

## Debugging

Press `F5` in VSCode to launch the debugger and you will be prompted for the host application. To avoid the prompt set the `hostAppSpecifier` in `launch.json`

You can't use breakpoints in your source files, because the [Extendscript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) doesn't support source maps. Instead, use a `debugger` statement in your source files or set breakpoints in the bundled file (`/build/{PRODUCT_NAME}.jsx`).

## Import JavaScript as String

To import JavaScript files as strings you can suffix the path with `?text` and import them with a custom default name. This is useful when you have snippets that you want to import as strings. Having them as separate files allows you to format and lint them separately, use TypeScript definitions on them, etc. Note that they will be imported as-is and don't get transpiled. This works for any other text based files.

See [src/main.js](./src/main.js#L6)

## Import Icons as Binary String

Using icons in [scriptUI](https://extendscript.docsforadobe.dev/user-interface-tools/) is easiest when you add them to your source code. To do this you can import the icons directly as `.png` or `.jpg`. They are then transformed to a binary string that can be read by [`File.decode()`](https://extendscript.docsforadobe.dev/file-system-access/file-object.html#decode).

See [src/main.js](./src/main.js#L17)

## Import Node Modules

You can import Node modules by simply using `import xyz from 'xyz'`. Note that they can't contain browser or Node APIs. Also note that quite some modern Javascript **is not yet** ponyfilled by [babel-preset-extendscript](https://github.com/fusepilot/babel-preset-extendscript#features).

## Static Files

The contents of `/static` will be copied to the `outdir` whenever you run the bundler. This is useful for icons, readme files, etc. Note that any changes in this folder will not be watched, so you need to run the bundler again or save a change in your source files.

## Minification

Release builds shorten variable names but keep whitespace intact because JSXBIN can fail when an ExtendScript bundle is collapsed into one very long line. The syntax remains intact to avoid Extendscript errors.

## Types for Adobe

[Types for Adobe](https://github.com/aenhancers/Types-for-Adobe) is part of the package, so you can simply use [triple-slash directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) to get the type definitions for your target app. Or create a [`tsconfig.json`](https://github.com/hyperbrew/bolt-cep/blob/master/src/jsx/tsconfig.json) to define which types to use in the whole project.

See [src/main.js](./src/main.js#L1-L2)

## Typescript

You should even be able to [make it work with Typescript](https://esbuild.github.io/content-types/#typescript) if that's your thing.

## By the way

You can still write regular old Extendscript without the modern syntax.
