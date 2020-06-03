import * as path from 'path'
import * as http from 'http'
import express from 'express'
import { createWebSocketServer } from './realtime'
import bodyParser from 'body-parser'
import cors from 'cors'
import fileUpload from 'express-fileupload'
import {
    existsAsync,
    mkdirAsync,
    moveFileAsync,
    processZip,
    processTakeoutDir,
} from './lib'
import { setCache } from './cache'

const corsOptions = {
    origin: (origin, callback) => {
        // Optionally restrict origins here
        /* origin && console.log('CORS', origin) */
        callback(null, true)
    }
}

const app = express()
const server = http.createServer(app)
const wss = createWebSocketServer(server)

app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(fileUpload())

app.get('/', async (req, res) => {
    res.json({ hello: 'world', date: Date() })
})

app.post('/upload', async (req, res) => {
    
    if (!req.body.ident) 
        return res.send({ error: 'Missing ident'})
    
    if (!req.files /* || Object.keys(req.files).length === 0 */) {
        console.log('no files', req.files)
        return res.send({ message: 'No files' })
    }
    
    const file = req.files.file
    const dest = path.resolve(__dirname, '../uploads')
    const destFile = path.join(dest, file.name)
    const destExists = await existsAsync(dest)
    
    if (!destExists) try {
        await mkdirAsync(dest)
    } catch (e) {
        return res.send({ error: `Failed to create directories, ${e.message}` })
    }
    
    try {
        await moveFileAsync(file, destFile)
    } catch (e) {
        return res.send({ error: `Failed to move file, ${e.message}` })
    }
    
    try {
        const playlists = await processZip(destFile, it => console.log('status', it))
        setCache(playlists)
        res.send({ message: 'success' })
    } catch (e) {
        console.error(e)
        res.send({ error: `Failed to process zip, ${e.message}` })
    }
    
})

export default app
