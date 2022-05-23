//const { Socket } = require('dgram')
const express = require('express')
const app = express() //Start Express
//const DataStore =require('nedb')
const path =require('path')
const WebSocket = require('ws')
const server = require('http').createServer(app)
const PORT = 3000
var knx = require('knx');
const exitHook = require('async-exit-hook');
const res = require('express/lib/response')

//BDD
//const db = new DataStore({filename: 'led'})
//db.loadDatabase()

//data format : JSON
app.use(express.json())
app.use(express.static('/pages'))

//variables globales
var chenille_On = false; // variable liée à la mise en marche du chenillard
//var startingChenille = true; // savoir si c'est le premier lancement du chenillard pour traitemet spécifique pour palier à un comportement inexpliqué

var ledIndice = 1; // variable qui servira à définir l'indice des LEDs à allumer
var ledIndicePrevious = 0;

var minSpeed = 300; // 300 ms - Au plus rapide, il s'écoulera un intervalle de 300 ms entre 2 étapes du chenillard
var intervalSpeed = 100; // 100 ms // interval de temps entre les différentes vitesses
var intChangingSpeed = 4; // allant de 0 à 8.
//slider.value = intChangingSpeed*10;
var actualSpeed = minSpeed + intChangingSpeed*100//slider.value*10; // minSpeed + intChangingSpeed*intervalSpeed 550 ms - evolue entre 50 ms et 1 050 ms selon clicks (1 click +- 100 ms)

var numMotif = 0; // variable liée au choix du motif du chenillard

var changing_motif = false;

// VARIABLES LIEES AUX DIFFERENTS MOTIFS
var toLeft = true; // used in motif 'BackToBack' and more | true car il intervient après le chenillard inversé
//var regime_stationnaire = false; // Savoir si le motif 'BackToBackEvolution' a atteint son fonctionnement normal
//var ind_regime_stat = 0; // combien de boucle on a effectué depuis le motif 'BackToBackEvolution'
//var nb_for_regime_stat; // combien de boucle faut-il pour etre stationnaire ?
//var ledIndiceAtPreciseMoment; // indice de la led lorsqu'on passe en motif 'BackToBackEvolution'
var parity = true; // used in motif 'parityQuinconce'
var lights_On = true; // used in motif 'everyLEDsOn'

//WebSocket
const wss = new WebSocket.Server({ server:server })

wss.on('connection', (ws) => {
    console.log("A new client Connected")
    // a la connexion, la page peut instannément s'actualiser en fonction de l'état des éléments
    ws.send(JSON.stringify({action: 'recuperation des donnees', 
                            chenille_On : chenille_On, 
                            ledIndice : ledIndice, 
                            ledIndicePrevious : ledIndicePrevious, 
                            numMotif : numMotif, 
                            actualSpeed : actualSpeed, 
                            toLeft : toLeft, 
                            parity : parity, 
                            lights_On : lights_On
                            /*etatLed1 : Lecture KNX de la led 1 ??
                            etatLed2 : Lecture KNX de la led 2 ??
                            etatLed3 : Lecture KNX de la led 3 ??
                            etatLed4 : Lecture KNX de la led 4 ??*/
                            // Est ce qu'on a vraiment besoin de l'etat des LEDs ??
                            // Peut etre que seul l'indice et le motif suffisent mais potentiels problèmes ? Notamment dans le mode aléatoire
                        }))

    ws.on('message', (text) => {
        let message = JSON.parse(text)
        console.log('received : %s', message.action)
        //ws.send('Got ur message its : ' + message.message)
        switch(message.action){
            default :
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({led: null, state: null,message: 'hello', action: "hello"}))
                })   // envoi à tous les clients 
        }
        
    })
})

//Read html
app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html')
    res.sendFile(`${__dirname}/front/fusion.html`)
})

app.get('/fusion', (req, res) => {
    res.set('Content-Type', 'text/javascript')
    res.sendFile(`${__dirname}/front/fusion.js`)
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

app.get('/images/led-green', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/led_icon_green.png`)
})

app.get('/images/led-yellow', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/led_icon_yellow.png`)
})

app.get('/images/led-red', (req, res) => {
    res.set('Content-Type', 'image/png')
    res.sendFile(`${__dirname}/front/images/led_icon_red.png`)
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

app.get('/btnChenillard', (req, res) => {
    console.log("le client a chenillé !")
    handleChenillard();
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "handleChenillard()", chenille_On : chenille_On, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious}))
    })
    console.log("j'ai envoyé ma socket")
})

app.get('/btnVitesseMoins', (req, res) => {
    console.log("le client augmente la vitesse ")
    diminuerVitesse()
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "diminuerVitesse()", actualSpeed : actualSpeed}))
    })
    console.log("j'ai envoyé ma socket")
})

app.get('/btnVitessePlus', (req, res) => {
    console.log("le client diminue la vitesse ")
    augmenterVitesse()
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "augmenterVitesse()", actualSpeed : actualSpeed}))
    })
})

app.get('/btnMotifs', (req, res) => {
    console.log("le client change de motif ")
    changeMotif()
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "changeMotif()", numMotif : numMotif, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious, changing_motif : changing_motif}))
    })
})

/*app.post('/led1', (req, res) => {
    console.log("le client a ppui")
    res.set('Content-Type', 'text/javascript')
    res.sendFile(`${__dirname}/front/fusion.js`)
})

app.get('/led1', (req, res) => {
    console.log("led1 GETTTTTT")
    res.set('Content-Type', 'text/javascript')
    res.sendFile(`${__dirname}/front/fusion.js`)
})*/

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
/*function led_toggle(indice, state_led){
  console.log("avant toggle", state_led);
  state_led = !state_led;
  console.log("apres toggle", state_led);
  connection.write("0/0/"+indice, state_led);
}
*/


var connection = new knx.Connection( {
    // ip address and port of the KNX router or interface
    ipAddr: '192.168.0.202', ipPort: 3671,
    // in case you need to specify the multicast interface (say if you have more than one)
    // interface: 'eth0',
    // the KNX physical address we'd like to use
    physAddr: '15.15.15',
    // set the log level for messsages printed on the console. This can be 'error', 'warn', 'info' (default), 'debug', or 'trace'.
    loglevel: 'info',
    // do not automatically connect, but use connection.Connect() to establish connection
    // manualConnect: true,  
    // use tunneling with multicast (router) - this is NOT supported by all routers! See README-resilience.md
    forceTunneling: true,
    // wait at least 10 millisec between each datagram
    minimumDelay: 10,
    // enable this option to suppress the acknowledge flag with outgoing L_Data.req requests. LoxOne needs this
    suppress_ack_ldatareq: false,
    // 14/03/2020 In tunneling mode, echoes the sent message by emitting a new emitEvent, so other object with same group address, can receive the sent message. Default is false.
    localEchoInTunneling:false,
    // define your event handlers here:
    handlers: {
      // wait for connection establishment before sending anything!
      connected: function() {
        console.log('Hurray, I can talk KNX!');
        // WRITE an arbitrary boolean request to a DPT1 group address
        reset_leds();
      },
      // get notified for all KNX events:
      event: function(evt, src, dest, value) { 
          console.log("event: %s, src: %j, dest: %j, value: %j", evt, src, dest, value);
          var responseString = JSON.stringify(value);
          var response = JSON.parse(responseString).data[0];
          var indice = dest.split("/")[2];
          var state = dest.split('/')[1];

          if(response == 0 && dest=="1/0/"+indice){
            // console.log("reponse == 0")
            // console.log(typeof indice);
            switch(indice){
              
              case "1" : 
                    handleChenillard();
                    // On active ou arrête le chenillard ! Seul le booléen nous intéresse ?? Etat des leds ??
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "handleChenillard()", chenille_On : chenille_On, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious}))
                    })
                    break;

              case "2" : 
                    diminuerVitesse(); 
                    // On diminue la vitesse du chenillard, seule la vitesse actuelle nous intéresse ?
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "diminuerVitesse()", actualSpeed : actualSpeed}))
                    })
                    break;
  
              case "3" : 
                    augmenterVitesse(); 
                    // On augmente la vitesse du chenillard, seule la vitesse actuelle nous intéresse ?
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "augmenterVitesse()", actualSpeed : actualSpeed}))
                    })
                    break;
  
              case "4" : 
                    changeMotif(); 
                    // On change de motif, seul le numéro de motif nous intéresse ??
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "changeMotif()", numMotif : numMotif, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious, changing_motif : changing_motif}))
                    })
                    break;
  
              default : break;
            }
          }

          
          
            if(state == "1" && response == 0){
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({action: "handleChenillard()", chenille_On : chenille_On, ledIndice : ledIndice}))
                })
            
            }else if(state == "1" && response == 1){
            
            }
          
          
      },
      // get notified on connection errors
      error: function(connstatus) {
        console.log("**** ERROR: %j", connstatus);
      }
    }
  });

  connection.Connect()


  /*
  var light = new knx.Devices.BinarySwitch({ga: '0/0/2', status_ga: '0/1/2'}, connection);
  console.log("The current light status is %j", light.status.current_value);
  light.control.on('change', function(oldvalue, newvalue) {
    console.log("**** LIGHT control changed from: %j to: %j", oldvalue, newvalue);
  });
  light.status.on('change', function(oldvalue, newvalue) {
    console.log("**** LIGHT status changed from: %j to: %j", oldvalue, newvalue);
  });
  light.switchOn(); // or switchOff();
*/
  exitHook(cb => {
    console.log('Disconnecting from KNX…');
    connection.Disconnect(() => {
      console.log('Disconnected from KNX');
      cb();
    });
  });

  function sleep (time) { // sleep ms
    return new Promise((resolve) => setTimeout(resolve, time));
}

function reset_leds(){ //remet toutes les LEDs en bleu
    connection.write("0/0/1", 0);
    connection.write("0/0/2", 0);
    connection.write("0/0/3", 0);
    connection.write("0/0/4", 0);
}

function handleChenillard(){
    console.log("On a appuyé sur le bouton du chenillard")
    if(chenille_On == true){ // le chenillard tourne : on veut l'arrêter et modifier la page en conséquence
        chenille_On = false;
    } else { // le chenillard ne tourne pas : on veut lancer le chenillard et modifier la page en conséquence
        chenille_On = true;
        //chenille(); // lancement du chenillard simple
        chenilleMOTIFS(); // lancement du chenillard avec choix du motif
    }
}

function diminuerVitesse(){
    console.log("On a appuyé sur le bouton augmenter vitesse")
    if(chenille_On == true){ // prise en charge de la modification seulement si chenillard actif (choix personnel)
        intChangingSpeed -= 1;
        if(intChangingSpeed < 0){ 
            intChangingSpeed = 0;
        } /*else if(intChangingSpeed < 20){
            intChangingSpeed += 1; // placer l'intervalle 95% entre 90% et 100% pour éviter un trop grand saut de vitesse
        } else;*/
        //slider.value = 10*intChangingSpeed;
        //actualSpeed = 1100 - slider.value*10;
        //actualizeSlider(); // mettre à jour le front
        actualSpeed = minSpeed + intChangingSpeed*100;
    }
}

function augmenterVitesse(){
    console.log("On a appuyé sur le bouton diminuer vitesse")
    if(chenille_On == true){ //modification seulement si chenillard actif (choix personnel)
        /*if(intChangingSpeed > 18){
            intChangingSpeed -= 1; // placer l'intervalle 95% entre 90% et 100% pour éviter un trop grand saut de vitesse
        } else if(intChangingSpeed > 0){
            intChangingSpeed -= 2;
        } else;*/
        intChangingSpeed += 1;
        if(intChangingSpeed > 8){
            intChangingSpeed = 8;
        }
        //slider.value = 10*intChangingSpeed;
        //actualSpeed = 1100 - slider.value*10;
        //actualizeSlider(); // mettre à jour le front
        actualSpeed = minSpeed + intChangingSpeed*100;
    }
}

function changeMotif(){
    console.log("On a appuyé sur le bouton pour changer de motif")
    if(chenille_On == true){ // modification seulement si chenillard actif (choix personnel)
        if(numMotif == 2){ // juste car un motif n'est pas encore implémenté
            numMotif += 2;
        } else {
            numMotif += 1;
        }
        // numMotif += 1;
        if(numMotif > 6){ // en fonction du nombre de motifs qui ont été implémenté
            numMotif = 0; // on redémarre le parcours des motifs
            ledIndice = 1; // redémarrer le chenillard à la 1ère LED quand on recommence le parcours des motifs
            ledIndicePrevious = 0; // used in multiple motifs
            // ind_regime_stat = 0;
            // regime_stationnaire = false; // both used in motif 4
            parity = true; // used in motif 5
            lights_On = true; // used in motif6
        }
        changing_motif = true;
    } 
    console.log("le motif est :", numMotif)
}

function decideMotif(){
    switch(numMotif){
        case 0 :
            return "chenillardSimple";              // oxxx | xoxx | xxox | xxxo | oxxx | xoxx | xxox | xxxo | oxxx
        case 1 :
            return "chenillardInverse";             // oxxx | xxxo | xxox | xoxx | oxxx | xxxo | xxox | xoxx | oxxx
        case 2 :
            return "chenillardBackToBack";          // oxxx | xoxx | xxox | xxxo | xxox | xoxx | oxxx | xoxx | xxox
        // case 3 :
        //     ledIndiceAtPreciseMoment = ledIndice;   // xxox | xoox | ooox | oooo | oooo | oooo | oooo | xooo | xxoo
        //     return "chenillardBackToBackEvolution"; // xxxo | oxxo | ooxo | oooo | ooox | ooxx | oxxx | xxxx | oxxx
        case 4 :
            return "allumageAleatoire";             // oxxx | oxxo | oxoo | xxoo | oxoo | oxxo | xxxo | xxoo | xxox
        case 5 :
            return "parityQuinconce";               // oxox | xoxo | oxox | xoxo | oxox
        case 6 :
            return "everyLEDsOn";                   // oooo | xxxx | oooo | xxxx | oooo
    }
}

/* Fonction recursive responsable du chenillard et de tous ses modes */
function chenilleMOTIFS(){
    //console.log("traitement du chenillard...")
    if(chenille_On == true){ // on vérifie que l'on veuille qu'il tourne (selon les clicks sur btnChenillard)
        //console.log("on attend entre chaque appel : ", actualSpeed)
        sleep(actualSpeed).then(() => { //max speed = 50 ms / min speed = 1050 ms / fonction affine pour la vitesse
            switch(decideMotif()){
                case "chenillardSimple" : // Les LEDs s'allument une à une de gauche à droite
                    //reset_leds();
                    //tabLeds[ledIndice].src = "images/led-orange";
                    if(changing_motif == true && lights_On == false){ //si on recommence le chenillard classique et que les LEDs étaient à l'état allumé à la fin du motif 6
                        reset_leds();  
                        //console.log("resetled")                               //on les éteint pour recommencer dans de bonnes conditions         
                    }
                    if(ledIndicePrevious != 0){ 
                        connection.write("0/0/"+ledIndicePrevious, 0); //on éteint la led qui a été allumée au coup d'avant
                        //console.log("0/0/0")
                    }
                    //console.log("0/0/1")
                    connection.write("0/0/"+ledIndice, 1); //on allume la suivante
                    ledIndicePrevious = ledIndice; 
                    ledIndice += 1;
                    if(ledIndice > 4){ // > tabLeds.length -1
                        ledIndice = 1;
                    } //calcul des indices pour l'appel suivant
                    return chenilleMOTIFS();

                case "chenillardInverse" : // Les LEDs s'allument une à une de droite à gauche (à partir de la led du motif précédent)
                    //reset_leds();
                    //tabLeds[ledIndice].src = "images/led-orange";
                    if(changeMotif == true){ // si on arrive juste dedans, il faut ajuster l'indice actuel comme on change de sens
                        ledIndice -= 2;
                        if(ledIndice == -1){ledIndice = 3}
                        else if(ledIndice == 0){ledIndice = 4}
                        changeMotif = false;
                    }
                    connection.write("0/0/"+ledIndicePrevious, 0);
                    connection.write("0/0/"+ledIndice, 1);
                    ledIndicePrevious = ledIndice;
                    ledIndice -=1;
                    if(ledIndice < 1){
                        ledIndice = 4;
                    }
                    return chenilleMOTIFS();
                
                case "chenillardBackToBack" : // Les LEDs s'allument une à une de droite à gauche puis de gauche à droite (à partir de la led du motif précédent)
                    //reset_leds();
                    //tabLeds[ledIndice].src = "images/led-orange"
                    connection.write("0/0/"+ledIndicePrevious, 0);
                    connection.write("0/0/"+ledIndice, 1);
                    ledIndicePrevious = ledIndice;
                    if(ledIndice <= 1){
                        toLeft = false;
                    } else if (ledIndice >= 4){ // >= tabLeds.length -1
                        toLeft = true;
                    }
                    if(toLeft == true){
                        ledIndice -= 1;
                    } else {
                        ledIndice += 1;
                    }
                    return chenilleMOTIFS();

                // case "chenillardBackToBackEvolution" : // Une à une, les LEDs s'allument jusqu'à être toutes allumées puis s'éteignent jusqu'à être toutes éteintes et ainsi de suite
                //     if(regime_stationnaire == false){ //on est en transition du motif
                //         tabLeds[ledIndice].src = "images/led-orange"; // dans le régime transit on ne fait que allumer des LEDs
                //         if(toLeft == true){ // si on etait en train d'aller à gauche
                //             /*if(ledIndiceAtPreciseMoment == 3){ // si on etait sur la led3
                //                 nb_for_regime_stat = 2; // on aura que 3 leds à allumer pour que ce soit full allumé + sur le bord
                //             } else {nb_for_regime_stat = 3 + ledIndiceAtPreciseMoment} // sinon 4 + nb LED
                //             */
                //             ledIndice -= 1; // dans tous les cas, on reste dans le même sens dans le régime transitoire
                //             if(ledIndice < 0){
                //                 ledIndice = 3; // = tabLeds.length -1
                //             }
                //         } else if (toLeft == false){ // si on allait à droite
                //             /*if(ledIndiceAtPreciseMoment == 0){ // si on était à la led0
                //                 nb_for_regime_stat = 2; // on aura que 3 leds à allumer pour que ce soit full allumé + sur le bord
                //             } else {nb_for_regime_stat = 6 - ledIndiceAtPreciseMoment} // sinon 7 - nb LED
                //             */
                //             ledIndice += 1; // on reste dans le même sens dans le régime transitoire
                //             if(ledIndice > 3){ // > tabLeds.length -1
                //                 ledIndice = 0;
                //             }
                //         } else;
                //         ind_regime_stat += 1; // on incrémente le nombre d'appels du motif
                //         if(ind_regime_stat >= 3){ // lorsqu'on aura atteint le régime stationnaire selon le nombre d'appels déjà effectués
                //             regime_stationnaire = true; // on rentre dans le régime stationnaire
                //         }
                //     } else if(regime_stationnaire == true){
                //         reset_leds();
                //         if(lancement_stat == true){
                //             if(toLeft == true){
                //                 ledIndice = 0;
                //                 toLeft = false;
                //             } else {
                //                 ledIndice == 3;
                //                 toLeft = true;
                //             }
                //             tabLeds[ledIndice].src = "images/led-blue";
                //             if(toLeft == true){
                //                 ledIndice -= 1;
                //             } else {
                //                 ledIndice += 1;
                //             }
                //         } else {
                //             if(ledIndice <= 0){
                //                 toLeft = false;
                //             } else if (ledIndice >= 3){
                //                 toLeft = true;
                //             }
                //             if(toLeft == true){
                //                 ledIndice -= 1;
                //             } else {
                //                 ledIndice += 1;
                //             }
                //             if()
                //         }                           
                //     } else;

                //     return chenilleMOTIFS();
            
                case "allumageAleatoire" : 
                    ledIndice = 1 + Math.floor(Math.random() * 4); // numéro de LED aléatoire
                    var rand = Math.floor(Math.random() * 2); // 1 chance sur 2 de s'allumer ou de s'éteindre
                    if(rand == 0){
                        //tabLeds[ledIndice].src = "images/led-orange";
                        connection.write("0/0/"+ledIndice, 1);
                    } else {
                        //tabLeds[ledIndice].src = "images/led-blue";
                        connection.write("0/0/"+ledIndice, 0);
                    }
                    return chenilleMOTIFS();
                
                case "parityQuinconce" : // les LEDs paires sont allumées et les impaires éteintes, puis l'inverse et ainsi de suite
                    if(parity == true){ // changement à chaque rappel de la fonction, donc 1 coup sur 2
                        //while(i < tabLeds.length){ 
                        connection.write("0/0/1", 1);
                        connection.write("0/0/2", 0);
                        connection.write("0/0/3", 1);
                        connection.write("0/0/4", 0);
                    } else {
                        connection.write("0/0/1", 0);
                        connection.write("0/0/2", 1);
                        connection.write("0/0/3", 0);
                        connection.write("0/0/4", 1);
                    }
                    parity = !parity; // changement d'état pour la prochaine boucle
                    return chenilleMOTIFS();

                case "everyLEDsOn" : // toutes les LEDs s'allument puis toutes les LEDs s'éteignent
                    /*if(changing_motif == true){
                        lights_On = true;
                        changing_motif = false;
                    }*/
                    if(lights_On == true){
                        //tabLeds.forEach(elem_led => elem_led.src = "images/led-orange");
                        connection.write("0/0/1", 1);
                        connection.write("0/0/2", 1);
                        connection.write("0/0/3", 1);
                        connection.write("0/0/4", 1);
                    } else{
                        reset_leds();
                    }
                    lights_On = !lights_On; // changement d'état pour la prochaine boucle
                    return chenilleMOTIFS();
            }
        })
    }
    else;
}