export default function Home(){
    return (
        <div className="home">
            <h1>Accueil</h1>
            <p>Dans ce module nous allons gérer un tableau KNX controllant des LEDs.</p>
            <form>
                <input type="button" id="btnLed1" value="Allumer led 1" onClick={changeState1}></input>
                <input type="button" id="btnLed2" value="Allumer led 2" onClick={changeState2}></input>
                <input type="button" id="btnLed3" value="Allumer led 3" onClick={changeState3}></input>
                <input type="button" id="btnLed4" value="Allumer led 4" onClick={changeState4}></input>
            </form>
            <form>
                <p id="stateLed1">Led 1 éteinte 🔴</p>
                <p id="stateLed2">Led 2 éteinte 🔴</p>
                <p id="stateLed3">Led 3 éteinte 🔴</p>
                <p id="stateLed4">Led 4 éteinte 🔴</p>
            </form>
        </div>
    );
};

function changeState1(){
    var state = document.getElementById("btnLed1")
    var text = document.getElementById("stateLed1")
 
    if(state.value === "Allumer led 1"){
        state.value = "Eteindre led 1"
        text.textContent = "Led 1 allumée 🟢"
    }else {
        state.value = "Allumer led 1"
        text.textContent = "Led 1 éteinte 🔴"
    }
}

function changeState2(){
    var state = document.getElementById("btnLed2")
    var text = document.getElementById("stateLed2")
 
    if(state.value === "Allumer led 2"){
        state.value = "Eteindre led 2"
        text.textContent = "Led 2 allumée 🟢"
    }else {
        state.value = "Allumer led 2"
        text.textContent = "Led 2 éteinte 🔴"
    }
}

function changeState3(){
    var state = document.getElementById("btnLed3")
    var text = document.getElementById("stateLed3")
 
    if(state.value === "Allumer led 3"){
        state.value = "Eteindre led 3"
        text.textContent = "Led 3 allumée 🟢"
    }else {
        state.value = "Allumer led 3"
        text.textContent = "Led 3 éteinte 🔴"
    }
}

function changeState4(){
    var state = document.getElementById("btnLed4")
    var text = document.getElementById("stateLed4")
 
    if(state.value === "Allumer led 4"){
        state.value = "Eteindre led 4"
        text.textContent = "Led 4 allumée 🟢"
    }else {
        state.value = "Allumer led 4"
        text.textContent = "Led 4 éteinte 🔴"
    }
}


//l'export permet de rendre le composant Home utilisable partout

