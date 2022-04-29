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

    ws.on('message', (text) => {
        let message = JSON.parse(text)
        console.log('received : %s', message)
        ws.send('Got ur message its : ' + message)
        //wss.clients.forEach()   // envoi à tous les clients 
    })
})

//Read html
app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html')
    res.sendFile(`${__dirname}/front/index3.html`)
})

/*app.get('/images/led-off', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/led_icon_off.png`)
})*/

app.get('/images/led-blue', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/led_icon_blue.png`)
})

app.get('/images/led-orange', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/led_icon_orange.png`)
})

app.get('/images/btn-icon', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/button_icon.png`)
})

app.get('/images/poweroff', (req, res) => {
    res.set('Content-Type', 'image/jpg')
    res.sendFile(`${__dirname}/front/images/poweroff.jpg`)
})
//route vers l'image puis dans le code de la page dire où aller chercher l'image

// //API CRUD

//Create
// app.post('/api/led', (req, res) => {
//     res.set('Content-Type', 'application/json')
//     console.log(req.body)
//     db.insert(req.body)
//     //res.send(req.body)
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