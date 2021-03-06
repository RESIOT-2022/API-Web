//VARIABLES GLOBALES COMMUNES, IDENTIQUES A CELLES COTE SERVEUR
var chenille_On = false; // variable liée à la mise en marche du chenillard
var startingChenille = true; // savoir si c'est le premier lancement du chenillard pour traitemet spécifique pour palier à un comportement inexpliqué

var ledIndice = 1; // variable qui servira à définir l'indice des LEDs à allumer
var ledIndicePrevious = 0;

var minSpeed = 300; // 50 ms - Au plus rapide, il s'écoulera un intervalle de 50 ms entre 2 étapes du chenillard
var intervalSpeed = 80; // 80 ms // interval de temps entre les différentes vitesses
var intChangingSpeed = 5; // allant de 0 à 10.
var actualSpeed = minSpeed + intChangingSpeed*intervalSpeed//slider.value*10; // minSpeed + intChangingSpeed*intervalSpeed 550 ms - evolue entre 50 ms et 1 050 ms selon clicks (1 click +- 100 ms)

var numMotif = 0; // variable liée au choix du motif du chenillard

var changing_motif = false;

// VARIABLES LIEES AUX DIFFERENTS MOTIFS
var toLeft = true; // used in motif 'BackToBack' and more | true car il intervient après le chenillard inversé
// var regime_stationnaire = false; // Savoir si le motif 'BackToBackEvolution' a atteint son fonctionnement normal
// var ind_regime_stat = 0; // combien de boucle on a effectué depuis le motif 'BackToBackEvolution'
// var nb_for_regime_stat; // combien de boucle faut-il pour etre stationnaire ?
// var ledIndiceAtPreciseMoment; // indice de la led lorsqu'on passe en motif 'BackToBackEvolution'
var parity = true; // used in motif 'parityQuinconce'
var lights_On = true; // used in motif 'everyLEDsOn'

var led1 = document.getElementById("led1");
var led2 = document.getElementById("led2");
var led3 = document.getElementById("led3");
var led4 = document.getElementById("led4");
var tabLeds = [led1, led2, led3, led4];

var btnChenillard = document.getElementById("btnChenillard");
var btnVitesseMoins = document.getElementById("btnVitesseMoins");
var btnVitessePlus = document.getElementById("btnVitessePlus");
var btnMotifs = document.getElementById("btnMotifs");

var slider = document.getElementById("slider");
var SelectBtn = document.getElementById("SelectBtn");
var SelectValue = document.getElementById("SelectValue");
var ProgressBar2 = document.getElementById("ProgressBar2");

var oReq = new XMLHttpRequest();

/*###################################################################################
###############             MISE EN PLACE DES WEBSOCKETS            ################# 
###################################################################################*/
//Create WebSocket connection
const socket = new WebSocket('ws://localhost:3000')

//Connection opened
socket.addEventListener('open', (event) => {
    socket.send(JSON.stringify({message : 'connection'}))
})

//Listen for messages
socket.addEventListener('message', (event) => {
    //le message envoyé par le serveur doit être un JSON
    console.log(typeof event.data)
    console.log(event.data)
    let message = JSON.parse(event.data)
    console.log(message)
    console.log(message.action);
    switch(message.action){
        case "recuperation des donnees":
            chenille_On = message.chenille_On;
            ledIndice = ledIndice;
            ledIndicePrevious = ledIndicePrevious;
            numMotif = numMotif;
            actualSpeed = message.actualSpeed;
            toLeft = message.toLeft;
            parity = message.parity;
            lights_On = message.lights_On;
            actualizeSlider();
            chenilleMOTIFS();
            break

        case "handleChenillard()":    // Changer l'état de la LED
            chenille_On = message.chenille_On;
            chenilleMOTIFS();
            break

        case "diminuerVitesse()":
            actualSpeed = message.actualSpeed;
            console.log("vitesse : " +actualSpeed)
            actualizeSlider();
            break;

        case "augmenterVitesse()":
            actualSpeed = message.actualSpeed;
            console.log("vitesse : " +actualSpeed)
            actualizeSlider();
            break;

        case "changeMotif()":
            numMotif = message.numMotif;
            ledIndice = message.ledIndice;
            ledIndicePrevious = message.ledIndicePrevious;
            changing_motif = message.changing_motif;
            parity = message.parity;
            lights_On = message.lights_On;
            console.log("motif en cours : "+numMotif)
        default:
            break;
    }
})

function actualizeSlider(){ // mettre à jour le front des slides bars
    slider.value = (1100 - actualSpeed)/8
    SelectValue.innerHTML = slider.value;
    let position = 0.45 *slider.value +26   // fonction affine du slider pour afficher le curseur au bon endroit sur la barre en focntion de la vitesse du chenillard
    SelectBtn.style.left = position + "%"
    SelectValue.style.left = position + "%"
    ProgressBar2.style.width = slider.value + "%";
}


btnChenillard.onclick = function(){
    oReq.open("GET", "/btnChenillard", true);
    oReq.send();
}

btnVitesseMoins.onclick = function(){
    oReq.open("GET", "/btnVitesseMoins", true);
    oReq.send();
    
}

btnVitessePlus.onclick = function(){
    oReq.open("GET", "/btnVitessePlus", true);
    oReq.send();
}

btnMotifs.onclick = function(){
    oReq.open("GET", "/btnMotifs", true);
    oReq.send();
}

// /*###################################################################################
// ##########              INITIALISATION DES VARIABLES GLOBALES             ########### 
// ###################################################################################*/
// /*var p = document.getElementById("p");

// var led1 = document.getElementById("led1");
// var led2 = document.getElementById("led2");
// var led3 = document.getElementById("led3");
// var led4 = document.getElementById("led4");
// var tabLeds = [led1, led2, led3, led4]; // tableau des LEDs

// var initialisation = true

// var btnChenillard = document.getElementById("btnChenillard");
// var btnVitesseMoins = document.getElementById("btnVitesseMoins");
// var btnVitessePlus = document.getElementById("btnVitessePlus");
// var btnMotifs = document.getElementById("btnMotifs"); // boutons poussoirs

// var slider = document.getElementById("slider");
// var SelectBtn = document.getElementById("SelectBtn");
// var SelectValue = document.getElementById("SelectValue");
// var ProgressBar2 = document.getElementById("ProgressBar2");

// var chenille_On = false; // variable liée à la mise en marche du chenillard
// var startingChenille = true; // savoir si c'est le premier lancement du chenillard pour traitemet spécifique pour palier à un comportement inexpliqué

// var ledIndice = 0; // variable qui servira à définir l'indice des LEDs à allumer

// var minSpeed = 100; // 50 ms - Au plus rapide, il s'écoulera un intervalle de 50 ms entre 2 étapes du chenillard
// var intervalSpeed = 100; // 100 ms // interval de temps entre les différentes vitesses
// var intChangingSpeed = 5; // allant de 0 à 10.
// slider.value = intChangingSpeed*10;
// var actualSpeed = minSpeed + slider.value*10; // minSpeed + intChangingSpeed*intervalSpeed 550 ms - evolue entre 50 ms et 1 050 ms selon clicks (1 click +- 100 ms)

// var numMotif = 0; // variable liée au choix du motif du chenillard

// // VARIABLES LIEES AUX DIFFERENTS MOTIFS
// var toLeft = true; // used in motif 'BackToBack' and more | true car il intervient après le chenillard inversé
// var regime_stationnaire = false; // Savoir si le motif 'BackToBackEvolution' a atteint son fonctionnement normal
// var ind_regime_stat = 0; // combien de boucle on a effectué depuis le motif 'BackToBackEvolution'
// var nb_for_regime_stat; // combien de boucle faut-il pour etre stationnaire ?
// var ledIndiceAtPreciseMoment; // indice de la led lorsqu'on passe en motif 'BackToBackEvolution'
// var parity = true; // used in motif 'parityQuinconce'
// var lights_On = true; // used in motif 'everyLEDsOn'

// SelectValue.innerHTML = slider.value;
// ProgressBar2.style.width = slider.value + "%";

// function led_toggle(indice, state_led){
//     console.log("avant toggle", state_led);
//     state_led = !state_led;
//     console.log("apres toggle", state_led);
//     connection.write("0/0/"+indice, state_led);
//   }

// window.onload = function () {
//     installEventsOnMyFuckingTable();
//     console.log(slider.value);
// }

function sleep (time) { // sleep ms
    return new Promise((resolve) => setTimeout(resolve, time));
}

function reset_leds(){ //remet toutes les LEDs en bleu
    tabLeds.forEach(elem_led => elem_led.src = "images/led-blue") //remet toutes les LEDs à l'état initial = bleu
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

// /* Fonction recursive responsable du chenillard et de tous ses modes */
function chenilleMOTIFS(){
    //p.innerHTML = `indice de led : ${ledIndice} | indice precis : ${ledIndiceAtPreciseMoment} | regime stationnaire : ${regime_stationnaire}\n indice regime stat : ${ind_regime_stat} | nb for regime stat : ${nb_for_regime_stat}`;
    if(chenille_On == true){ // on vérifie que l'on veuille qu'il tourne (selon les clicks sur btnChenillard)
        sleep(actualSpeed).then(() => { //max speed = 50 ms / min speed = 1050 ms / fonction affine pour la vitesse
            switch(decideMotif()){
                case "chenillardSimple" : // Les LEDs s'allument une à une de gauche à droite
                    reset_leds();
                    tabLeds[ledIndice-1].src = "images/led-orange";
                    ledIndice += 1;
                    if(ledIndice > 4){ // > tabLeds.length -1
                        ledIndice = 1;
                    }
                    return chenilleMOTIFS();

                case "chenillardInverse" : // Les LEDs s'allument une à une de droite à gauche (à partir de la led du motif précédent)
                    reset_leds();

                    tabLeds[ledIndice-1].src = "images/led-orange";
                    ledIndice -= 1;
                    if(ledIndice < 1){
                        ledIndice = 4; // = tabLeds.length -1
                    }
                    return chenilleMOTIFS();
                
                case "chenillardBackToBack" : // Les LEDs s'allument une à une de droite à gauche puis de gauche à droite (à partir de la led du motif précédent)
                    reset_leds();
                    tabLeds[ledIndice-1].src = "images/led-orange"
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

                // MOTIF DONT LE FONCTIONNEMENT 
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
                        tabLeds[ledIndice-1].src = "images/led-orange";
                    } else {
                        tabLeds[ledIndice-1].src = "images/led-blue";
                    }
                    return chenilleMOTIFS();
                
                case "parityQuinconce" : // les LEDs paires sont allumées et les impaires éteintes, puis l'inverse et ainsi de suite
                    var i = 0;
                    if(parity == true){ // changement à chaque rappel de la fonction, donc 1 coup sur 2
                        while(i < tabLeds.length){ 
                            if(i%2 == 0){
                                tabLeds[i].src = "images/led-orange";
                            } else{
                                tabLeds[i].src = "images/led-blue";
                            }
                            i = i + 1;
                        }
                    // while et if implémentables avec un éventuel tableau de LEDs de n éléments
                    } else {
                        while(i < tabLeds.length){
                            if(i%2 == 0){
                                tabLeds[i].src = "images/led-blue";
                            } else{
                                tabLeds[i].src = "images/led-orange";
                            }
                            i = i + 1;
                        }
                    }
                    if(parity == true){ parity = false;}
                    else{ parity = true; } // changement d'état pour la prochaine boucle
                    return chenilleMOTIFS();

                case "everyLEDsOn" : // toutes les LEDs s'allument puis toutes les LEDs s'éteignent
                    if(lights_On == true){
                        tabLeds.forEach(elem_led => elem_led.src = "images/led-orange");
                    } else{
                        reset_leds();
                    }
                    if(lights_On == true){lights_On = false;}
                    else{lights_On = true;} // changement d'état pour la prochaine boucle
                    return chenilleMOTIFS();
            }
        })
    }
    else;
}