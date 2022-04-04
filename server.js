const express = require('express')
const app = express() //Start Express
const DataStore =require('nedb')
const path =require('path')
const WebSocket = require('ws')
const server = require('http').createServer(app)
const PORT = 8080

//BDD
const db = new DataStore({filename: 'led'})
db.loadDatabase()

//data format : JSON
app.use(express.json())
app.use(express.static('/pages'))

//WebSocket
const wss = new WebSocket.Server({ server:server })

wss.on('connection', (ws) => {
    console.log("A new client Connected")
    ws.send('Welcome new client')

    ws.on('message', (message) => {
        console.log('received : %s', message)
        ws.send('Got ur message its : ' + message)
    })
})

//Read html
app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html')
    res.sendFile(`${__dirname}/pages/home.html`)
})

// //API CRUD

// //Create
// app.post('/api/led', (req, res) => {
//     console.log(req.body)
//     db.insert(req.body)
//     res.send(req.body)
// })

// //Read html
// app.get('/', (req, res) => {
//     res.set('Content-Type', 'text/html')
//     res.sendFile(`${__dirname}/pages/home.html`)
// })

// //Read All
// app.get('/api/led', (req, res) => {
//     db.find({}, (err, docs) => {
//         if(err) console.log(err)

//         res.send(docs)
//     })
// })

// //Read One
// app.get('/api/led/:id', (req, res) => {
//     db.find({_id: req.params.id}, (err, docs) => {
//         if(err) console.log(err)
        
//         res.send(docs)
//     })
// })

// //Update
// app.patch('/api/led/:id', (req, res) => {
//     db.update({_id: req.params.id}, {$set: {...req.body} })
//     res.send(req.body)
// })

// //Delete
// app.delete('/api/led/:id', (req, res) => {
//     db.remove({_id: req.params.id})
// })

server.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})

/*
const genererPageHtml = require('./pages/home.js')
app.get('/', async(req, res) => {
    const indexHtml = await genererPageHtml()
    res.send(indexHtml)
})

Dans le fichier JS il faut :
const {readFile} = require('fs')
const {profisify} = require('util')
const readFileAsync = promisify(readFile)

module.exports = async() => {
    // Opération
    // Récupérer le contenu du fichier html home.html
    const contenu = await readFileAsync(path, {encoding: 'utf-8'})
    // Retourner la page html
    return contenu
}
*/