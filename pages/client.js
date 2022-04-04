//Create WebSocket connection
const socket = new WebSocket('ws://localhost:8080')

//Connection opened
socket.addEventListener('open', (event) => {
    socket.send('hello server!!')
})

//Listen for messages
socket.addEventListener('message', (event) => {
    console.log('Message from server : ' + event.data)
})

const sendMessage = () => {
    socket.send('Hello from client')
}