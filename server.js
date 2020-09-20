const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uudiV4 } = require('uuid');
const { Socket } = require('dgram');

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uudiV4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)

        socket.on('webrtc_ice_candidate', (roomId, userId) => {
            console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${roomId}`)
            socket.to(roomId).broadcast.emit('webrtc_ice_candidate', userId)
        })

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
        })
    })
})

server.listen(port);