const express = require('express')
const app = express() //Start Express
//const path =require('path')
const WebSocket = require('ws')
const server = require('http').createServer(app)
const PORT = 3000
var knx = require('knx');
const exitHook = require('async-exit-hook');
//const res = require('express/lib/response')

//data format : JSON
app.use(express.json())
app.use(express.static('/pages'))

//variables globales
var chenille_On = false; // variable liée à la mise en marche du chenillard

var ledIndice = 1; // variable qui servira à définir l'indice des LEDs à allumer
var ledIndicePrevious = 0;

var minSpeed = 300; // 300 ms - Au plus rapide, il s'écoulera un intervalle de 300 ms entre 2 étapes du chenillard
var intervalSpeed = 80; // 80 ms // interval de temps entre les différentes vitesses
var intChangingSpeed = 5; // allant de 0 à 10.
var actualSpeed = minSpeed + intChangingSpeed*intervalSpeed//slider.value*10; // minSpeed + intChangingSpeed*intervalSpeed 550 ms - evolue entre 50 ms et 1 050 ms selon clicks (1 click +- 100 ms)

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
    res.sendFile(`${__dirname}/front/main.html`)
})

app.get('/main.js', (req, res) => {
    res.set('Content-Type', 'text/javascript')
    res.sendFile(`${__dirname}/front/main.js`)
})

app.get('/main.css', (req, res) => {
    res.set('Content-Type', 'text/css')
    res.sendFile(`${__dirname}/front/main.css`)
})

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

app.get('/btnChenillard', (req, res) => {
    handleChenillard();
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "handleChenillard()", chenille_On : chenille_On, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious}))
    })
})

app.get('/btnVitesseMoins', (req, res) => {
    diminuerVitesse()
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "diminuerVitesse()", actualSpeed : actualSpeed}))
    })
})

app.get('/btnVitessePlus', (req, res) => {
    augmenterVitesse()
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "augmenterVitesse()", actualSpeed : actualSpeed}))
    })
})

app.get('/btnMotifs', (req, res) => {
    changeMotif()
    wss.clients.forEach(client => {
        client.send(JSON.stringify({action: "changeMotif()", numMotif : numMotif, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious, changing_motif : changing_motif}))
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})

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
            switch(indice){
              
              case "1" : 
                    handleChenillard();
                    // On active ou arrête le chenillard ! 
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "handleChenillard()", chenille_On : chenille_On, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious}))
                    })
                    break;

              case "2" : 
                    diminuerVitesse(); 
                    // On diminue la vitesse du chenillard, seule la vitesse actuelle nous intéresse
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "diminuerVitesse()", actualSpeed : actualSpeed}))
                    })
                    break;
  
              case "3" : 
                    augmenterVitesse(); 
                    // On augmente la vitesse du chenillard, seule la vitesse actuelle nous intéresse
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "augmenterVitesse()", actualSpeed : actualSpeed}))
                    })
                    break;
  
              case "4" : 
                    changeMotif(); 
                    // On change de motif, seul le numéro de motif nous intéresse ??
                    wss.clients.forEach(client => {
                        client.send(JSON.stringify({action: "changeMotif()", numMotif : numMotif, ledIndice : ledIndice, ledIndicePrevious : ledIndicePrevious, changing_motif : changing_motif, parity : parity, lights_On : lights_On}))
                    })
                    break;
  
              default : break;
            }
          }
      },
      // get notified on connection errors
      error: function(connstatus) {
        console.log("**** ERROR: %j", connstatus);
      }
    }
  });

  connection.Connect()

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

function reset_leds(){ // éteint toutes les LEDs
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
        chenilleMOTIFS(); // lancement du chenillard avec choix du motif
    }
}

function augmenterVitesse(){
    console.log("On a appuyé sur le bouton augmenter vitesse")
    if(chenille_On == true){ // prise en charge de la modification seulement si chenillard actif (choix personnel)
        intChangingSpeed -= 1;
        if(intChangingSpeed < 0){ 
            intChangingSpeed = 0;
        }
        actualSpeed = minSpeed + intChangingSpeed*intervalSpeed;
    }
}

function diminuerVitesse(){
    console.log("On a appuyé sur le bouton diminuer vitesse")
    if(chenille_On == true){ //modification seulement si chenillard actif (choix personnel)
        intChangingSpeed += 1;
        if(intChangingSpeed > 10){
            intChangingSpeed = 10;
        }
        actualSpeed = minSpeed + intChangingSpeed*intervalSpeed;
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
        //  ledIndiceAtPreciseMoment = ledIndice;   // xxox | xoox | ooox | oooo | oooo | oooo | oooo | xooo | xxoo
        //  return "chenillardBackToBackEvolution"; // xxxo | oxxo | ooxo | oooo | ooox | ooxx | oxxx | xxxx | oxxx
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
    if(chenille_On == true){ // on vérifie que l'on veuille qu'il tourne (selon les clicks sur btnChenillard)
        sleep(actualSpeed).then(() => { //max speed = 300 ms / min speed = 1100 ms / fonction affine pour la vitesse
            switch(decideMotif()){
                case "chenillardSimple" : // Les LEDs s'allument une à une de gauche à droite
                    if(changing_motif == true && lights_On == false){ //si on recommence le chenillard classique et que les LEDs étaient à l'état allumé à la fin du motif 6
                        reset_leds();  
                    }
                    if(ledIndicePrevious != 0){ 
                        connection.write("0/0/"+ledIndicePrevious, 0); //on éteint la led qui a été allumée au coup d'avant
                    }
                    connection.write("0/0/"+ledIndice, 1); //on allume la suivante
                    ledIndicePrevious = ledIndice; 
                    ledIndice += 1;
                    if(ledIndice > 4){ 
                        ledIndice = 1;
                    } //calcul des indices pour l'appel suivant
                    return chenilleMOTIFS();

                case "chenillardInverse" : // Les LEDs s'allument une à une de droite à gauche (à partir de la led du motif précédent)
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
                    connection.write("0/0/"+ledIndicePrevious, 0);
                    connection.write("0/0/"+ledIndice, 1);
                    ledIndicePrevious = ledIndice;
                    if(ledIndice <= 1){
                        toLeft = false;
                    } else if (ledIndice >= 4){ 
                        toLeft = true;
                    }
                    if(toLeft == true){
                        ledIndice -= 1;
                    } else {
                        ledIndice += 1;
                    }
                    return chenilleMOTIFS();
                
                // MOTIF DONT LE FONCTIONNEMENT N'EST PAS FINALISÉ
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
                    if(lights_On == true){
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