import express from "express"
import helmet from "helmet"
import bodyParser from "body-parser"

export default class Server {
    constructor(port) {
        this.server = express()
        
        // Security Middleware
        this.server.use(helmet())
        
        // Body Parser
        this.server.use(bodyParser.json())
        this.server.use(bodyParser.urlencoded({ extended: true }))
        
        // Static Files
        this.server.use(express.static('public'))
        
        // Basic Error Handling
        this.server.use((err, req, res, next) => {
            console.error(err.stack)
            res.status(500).send('Server Error!')
        })
        
        // Start Server
        this.listen = this.server.listen(port, () => {
            console.log(`Server running on port ${port}`)
            console.log(`QR Auth: http://localhost:${port}/qr`)
        })
    }
}
