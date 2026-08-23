import fs from 'fs/promises'

export const BINARY_ASSET_FILTER = /\.(?:png|jpe?g)$/i

export default function binaryString() {
    return {
        name: 'binary',
        setup(build) {
            build.onLoad({ filter: BINARY_ASSET_FILTER }, async (args) => {
                const filePath = args.path
                const data = await fs.readFile(filePath)
                const bin = data.toString('binary')
                return {
                    contents: encodeURIComponent(bin),
                    loader: 'text'
                }
            })
        }
    }
}
