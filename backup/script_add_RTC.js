const socket = io("/")
const videoGrid = document.getElementById('video-grid')
var myPC;

// Free public STUN servers provided by Google.
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
            urls: 'turn:52.88.28.2:3478',
            username: 'scholars1',
            credential: 'scholars1@!',
        },
    ],
}

const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001',
    iceServers: iceServers
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

myPC = new RTCPeerConnection(iceServers);

// triggered when a new candidate is returned
myPC.onicecandidate = (e) => {
    // send the candidates to the remote peer
    // see addCandidate below to be triggered on the remote peer
    if (e.candidate) {
        // console.log(JSON.stringify(e.candidate))
        this.sendToPeer('candidate', e.candidate);
    }
};

// triggered when there is a change in connection state
myPC.oniceconnectionstatechange = (e) => {
    console.log(e);
};

// triggered when a stream is added to pc, see below - this.pc.addStream(stream)
myPC.onaddstream = (e) => {
    this.remoteVideoref.current.srcObject = e.stream;
};

const success = (stream) => {
    window.localStream = stream;
    this.localVideoref.current.srcObject = stream;
    this.pc.addStream(stream);
};

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })
}).catch((e) => {
    console.log('getUserMedia Error: ', e);
});

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}