var btn = document.getElementById('btnLampe1');
var txt = document.getElementById('lampe_1');

btn.onClick = () => {
    if (btn.value === 'Allumer lampe 1') {
    btn.value = 'Eteindre lampe 1';
    txt.textContent = 'Lampe 1 allumée';
    } else {
    btn.value = 'Allumer lampe 1';
    txt.textContent = 'Lampe 1 éteinte';
    }
}

console.log('hello')
