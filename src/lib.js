import * as fs from 'fs'
import * as path from 'path'
import extract from 'extract-zip'
import csv from 'csvtojson'

let nextTrackId = 0
let nextPlaylistId = 0

export const existsAsync = dir => new Promise(resolve => {
    fs.exists(dir, resolve)
})

export const mkdirAsync = dir => new Promise((resolve, reject) => {
    fs.mkdir(dir, err => err ? rejects(err) : resolve())
})

export const moveFileAsync = (file, destFile) => new Promise((resolve, reject) => {
    file.mv(destFile, err => {
        if (err) return reject(err)
        resolve()
    })
})

export const statAsync = target => new Promise((resolve, reject) => {
    fs.stat(target, (err, stats) => {
        if (err) reject(err)
        else resolve(stats)
    })
})

export const readdirAsync = target => new Promise((resolve, reject) => {
    fs.readdir(target, (err, files) => {
        if (err) reject(err)
        else resolve(files)
    })
})

export const listDirsAsync = async (dir) => {
    const dirs = []
    const nodes = await readdirAsync(dir)
    for (let i in nodes) {
        const node = path.resolve(dir, nodes[i])
        const stat = await statAsync(node)
        if (stat.isDirectory())
            dirs.push(node)
    }
    return dirs
}

export const listFilesAsync = async (dir) => {
    const files = []
    const nodes = await readdirAsync(dir)
    for (let i in nodes) {
        const node = path.resolve(dir, nodes[i])
        const stat = await statAsync(node)
        if (!stat.isDirectory())
            files.push(node)
    }
    return files
}

export const readFileAsync = file => new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) reject(err)
        else resolve(data)
    })
})

export const processPlaylistMeta = file => new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return reject(err)
        csv({ headers: ['title', 'owner', 'description', 'shared', 'deleted'] })
            .fromString(data)
            .then(it => resolve(it[0]))
    })
})

export const processTrackMeta = file => new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) return reject(err)
        csv({ headers: ['Title', 'Album', 'Artist', 'Duration (ms)', 'Rating', 'Play Count', 'Removed', 'Playlist Index'] })
            .fromString(data)
            .then(it => resolve(it[0]))
    })
})

export const processZip = async (zipFile, updateStatus) => {
    
    const target = path.resolve(__dirname, '../uploads')
    
    try {
        await extract(zipFile, { dir: target })
    } catch (e) {
        console.error(e)
        return updateStatus(`Error extracting zip: ${e.message}`)
    }
    
    return await processTakeoutDir(updateStatus)
    
}

export const processTakeoutDir = async (updateStatus) => {
    
    const target = path.resolve(__dirname, '../uploads')
    const playlistsDir = path.join(target, 'Takeout/Google Play Music/Playlists')
    const playlistsDirExists = await existsAsync(playlistsDir)
    
    if (!playlistsDirExists)
        return updateStatus('Could not find any playlists')
    
    const playlistDirs = await listDirsAsync(playlistsDir)
    updateStatus(`Processing ${playlistDirs.length} playlists`)
    
    const playlists = []
    
    for (let i in playlistDirs) {
        const playlist = await processPlaylist(playlistDirs[i], updateStatus)
        playlists.push(playlist)
    }
    
    const trackCount = playlists.reduce((acc, it) => acc + it.tracks.length, 0)
    updateStatus(`Found ${playlists.length} playlists, ${trackCount} tracks`)
    
    return playlists
    
}

export const processPlaylist = async (playlistDir, updateStatus) => {
    
    const metaFile = path.resolve(playlistDir, 'Metadata.csv')
    const metaFileExists = await existsAsync(metaFile)
    const tracksDir = path.resolve(playlistDir, 'Tracks')
    const tracksDirExists = await existsAsync(tracksDir)
    
    let meta = { title: path.basename(playlistDir) }
    
    if (metaFileExists) try {
        meta = await processPlaylistMeta(metaFile)
    } catch (e) {
        console.warn(e)
    }
    
    nextPlaylistId++
    
    const playlist = {
        id: nextPlaylistId,
        title: meta.title || `Untitled ${Date.now()}`,
        tracks: [],
    }
    
    if (!tracksDirExists) {
        
        // @todo
        updateStatus(`No tracks for ${meta.title}`)
        
    } else {
        
        const files = await listFilesAsync(tracksDir)
        
        updateStatus(`Processing "${meta.title}", ${files.length} tracks`)
        //files.filter(it => !it.includes('Thumbs')).forEach(it => updateStatus(`\t> ${it}`))
        
        for (let i in files) {
            const file = files[i]
            const track = await processTrackMeta(file)
            nextTrackId++
            track.id = nextTrackId
            if (track.Title && track.Title.trim().length)
                playlist.tracks.push(track)
        }
        
    }
    
    return playlist
    
}
