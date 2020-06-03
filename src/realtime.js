import WebSocket from 'ws'
import shortid from 'shortid'
import * as Payloads from './payloads'
import { getCache } from './cache'

export const createWebSocketServer = httpServer => {
    
    const socketOpts = {
        host: process.env.HOST || '0.0.0.0',
        port: process.env.PORT ? (+process.env.PORT + 1) : 5000,
        server: httpServer,
    }
    
    const wss = new WebSocket.Server(socketOpts, () =>
        console.info(`Listening on wss://${socketOpts.host}:${socketOpts.port}`))
    
    wss.send = (id, data) => {
        wss.clients.forEach(client => {
            console.log('???', client.user.id, 'vs', id)
            if (client.user.id === id)
                client.send(
                    (typeof data !== 'object')
                        ? data
                        : JSON.stringify(data)
                )
        })
    }
    
    wss.broadcast = data => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN)
                client.send(
                    (typeof data !== 'object')
                        ? data : JSON.stringify(data))
        })
    }
    
    wss.broadcastExcludeSelf = (ws, data) => {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN)
                client.send(
                    (typeof data !== 'object')
                        ? data : JSON.stringify(data))
        })
    }
    
    const getRoster = () => {
        const users = []
        wss.clients.forEach(client => { users.push(client.user) })
        return users
    }
    
    const broadcastRoster = () => {
        getRoster().forEach(x => console.log(x))
        // Get users (excluding no-IDENT users)
        const roster = getRoster()
            .filter(u => !u.nickname.startsWith('__system__'))
        
        console.info('OUTGOING', 'Roster (' + roster.length, 'users)')
        
        return wss.broadcast({ roster })
        
    }
    
    const followPlaylists = async (userId, ids) => {
        console.log('@@follow', userId, ids/* .join(', ') */)
    }
    
    wss.on('connection', ws => {
        
        ws.user = { id: shortid.generate() }
        
        console.info('Client connected', ws.user)
        
        ws.on('close', (code, reason) => console.info('Disconnect', ws.user, code, reason))
        ws.on('error', (...args) => console.warn(...args))
        
        ws.on('message', async (message) => {
            
            console.log('INCOMING', message)
            
            try {
                message = JSON.parse(message)
            }
            catch (e) {
                console.warn(e)
                return ws.send(Payloads.MalformedPayload())
            }
            
            if (!message.type /* || !message.event.includes('.') */) {
                console.warn('Malformed message')
                return ws.send(Payloads.MalformedMissingEvent())
            }
            
            switch (message.type) {
                case 'playlists.list':
                    return ws.send(Payloads.Playlists(await getCache()))
                case 'playlists.follow':
                    const { ids, userId } = message.data
                    if (!ids || !userId) return ws.send(Payloads.PlaylistsFollowError('Missing playlist IDs'))
                    return ws.send(Payloads.PlaylistsFollow(await followPlaylists(userId, ids)))
            }
            
            console.warn('Unsupported event', type, event)
            return ws.send(Payloads.UnsupportedEvent(type, event))
            
        })
        
        ws.send(Payloads.Ident(ws.user.id))
        
    })
    
    return wss
    
}
