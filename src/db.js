import * as fs from 'fs'
import * as path from 'path'
import knex from 'knex'
import csv from 'csvtojson'

const db = knex({
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    }
})

const createTable = async (name, schemaUri) => {
    const uri = path.resolve(__dirname, schemaUri)
    const sql = fs.readFileSync(uri, 'utf8')
    console.info(`Creating ${name} table`)
    await db.raw(sql)
}

const init = async () => {
    
    const hasTracks = await db.schema.hasTable('tracks')
    const hasPlaylists = await db.schema.hasTable('playlists')
    const hasTracksPlaylists = await db.schema.hasTable('tracks_playlists')
    
    if (!hasTracks) await createTable('tracks', './schema/tracks.sql')
    if (!hasPlaylists) await createTable('plans', './schema/playlists.sql')
    if (!hasTracksPlaylists) await createTable('tracks_playlists', './schema/tracks_playlists.sql')
    
}

init()

export default db
