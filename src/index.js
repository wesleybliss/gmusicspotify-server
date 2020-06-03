import * as path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000
const uri = `http://${host}:${port}`

const start = async () => {
    const app = (await import('./app')).default
    app.listen(port, host, () => console.log(`Listening on ${uri}`))
}

start()
