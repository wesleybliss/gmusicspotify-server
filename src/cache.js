import * as path from 'path'
import {
    listDirsAsync,
    listFilesAsync,
    processZip,
    processTakeoutDir,
} from './lib'

let cache = []

export const getCache = async () => {
    if (cache && cache.length) return cache
    try {
        const dir = path.resolve(__dirname, '../uploads')
        const dirs = await listDirsAsync(dir)
        
        if (dirs.includes(path.join(dir, 'Takeout'))) {
            setCache(await processTakeoutDir(it => console.log('status', it)))
        } else {
            const files = await listFilesAsync(dir)
            const zips = files.filter(it => it.endsWith('.zip'))
            if (zips && zips.length) {
                const playlists = await processZip(zips[0], it => console.log('status', it))
                setCache(playlists)
            }
        }
    } catch (e) {
        console.error(e)
    }
    return cache
}

export const setCache = data => {
    cache = data
}
