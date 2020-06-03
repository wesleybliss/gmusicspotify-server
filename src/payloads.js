
const _error = msg => JSON.stringify({
    type: 'error',
    data: msg,
})

const _data = (type, obj) => JSON.stringify({
    type,
    data: obj,
})

export const Ident = (id) => _data('ident', id)
export const Playlists = playlists => _data('playlists.list', playlists)
export const PlaylistsFollow = result => _data('playlists.follow.result', result)
export const PlaylistsFollowError = message => _data('playlists.follow.error', message)

export const MalformedPayload = () => _error('Malformed payload')
export const MalformedMissingEvent = () => _error('Malformed payload - must have "event" key')
export const UnsupportedEvent = (type, event) => _error(`Unsupported event: ${type}, ${event}`)
