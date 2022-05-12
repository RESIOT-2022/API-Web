var knx = require('knx');
const exitHook = require('async-exit-hook');

var lightOn = [false, false, false, false] // états des LEDs à l'état initial
var numLed
var chenille
var chenillardOn = false
var vitesse = 600

var connection = new knx.Connection( {
    // ip address and port of the KNX router or interface
    ipAddr: '192.168.0.201', ipPort: 3671,
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
        for(let i=1; i<=lightOn.length; i++){
          connection.write("0/0/"+i, 0);
        }
      },
      // get notified for all KNX events:
      event: function(evt, src, dest, value) { 
          console.log("event: %s, src: %j, dest: %j, value: %j", evt, src, dest, value);

          var responseString = JSON.stringify(value) // value est un Buffer donc on le stringify
          var response = JSON.parse(responseString).data[0] // puis on le parse pour voir l'état du paramètre
          
          
          numLed = dest.split("/")[2] // récupération du numéro de LED
          // var appuiBP = "1/0/" + numLed

          if (dest == "1/0/1" && response == 0) { // test si on a appuyé sur le bouton puis relaché
            //toggle(numLed)  // changement d'état de la led
            if(!chenillardOn){
              chenillardOn = true
              numLed = 1
              console.log("chenillard appelé")
              
            }else{
              chenillardOn = false
              //clearInterval(chenillard)
              reset_leds()
              console.log("stop interval")
            }
          }

          var state = dest.split('/')[1]
          if(chenillardOn && response == 0){ // on agit en fonction de l'état de la led
            reset_leds()
            sleep(vitesse).then(chenillard())
          }
          sleep(vitesse)
          .then(reset_leds())
          .then(chenillard())

          if(dest == "1/0/2" && response == 0){

            vitesse -= 100
            if(vitesse < 100){
              vitesse = 100
            }
            
            console.log("vitesse : " + vitesse)
          }

          if(dest == "1/0/3" && response == 0){
            vitesse += 100
            if(vitesse > 1100){
              vitesse = 1100
            }
            
            console.log("vitesse : " + vitesse)
          }

          // setInterval(() => {
          //   reset_leds();
          //   [ledIndice].src = "images/led-orange";
          //   ledIndice += 1;
          //   if(ledIndice > 3){ // > tabLeds.length -1
          //       ledIndice = 0;
          //   }
          //   return chenilleMOTIFS();
          // })

          // connection.read("0/1/2", (src, responsevalue) => {
          //   console.log("src : %s | response : %j", src, responsevalue)
          // }); 
      },
      // get notified on connection errors
      error: function(connstatus) {
        console.log("**** ERROR: %j", connstatus);
      }
    }
  });

  connection.Connect()

  function toggle(led){
    lightOn = !lightOn
    connection.write("0/0/" + led, lightOn);
  }

  function reset_leds(){ //remet toutes les LEDs en bleu
    for(let i=0; i<lightOn.length; i++){
      let led = i + 1
      connection.write("0/0/"+led, 0)
    } //remet toutes les LEDs à l'état initial = bleu
  }

// function timeout(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

function sleep (time) { // sleep ms
  return new Promise((resolve) => setTimeout(resolve, time));
}

function chenillard() {
  connection.write("0/0/"+numLed, 1)
  numLed += 1
  if(numLed > 4){
    numLed = 1
  }
}
  
  // var light = new knx.Devices.BinarySwitch({ga: '0/0/2', status_ga: '0/1/2'}, connection);
  // console.log("The current light status is %j", light.status.current_value);
  // light.control.on('change', function(oldvalue, newvalue) {
  //   console.log("**** LIGHT control changed from: %j to: %j", oldvalue, newvalue);
  // });
  // light.status.on('change', function(oldvalue, newvalue) {
  //   console.log("**** LIGHT status changed from: %j to: %j", oldvalue, newvalue);
  // });
  // light.switchOn(); // or switchOff();

  exitHook(cb => {
    console.log('Disconnecting from KNX…');
    connection.Disconnect(() => {
      console.log('Disconnected from KNX');
      cb();
    });
  });


