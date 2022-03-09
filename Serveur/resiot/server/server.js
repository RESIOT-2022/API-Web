const express = require('express')
const app = express()

app.get('/', (req, res) => {
    res.send("Page d'accueil !")
    //res.sendFile('WelcomePage.html')
});

app.listen(8080, () => {
    console.log('salut')
});