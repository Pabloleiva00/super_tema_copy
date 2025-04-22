// src/js/call.js
import { API_URL } from './constantes';
import { io } from "socket.io-client";
import { loadNavbar } from './load_navbar.js';

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

const socket = io(API_URL, {
  auth: {
    token: token,
    userId: user.id
  }
});

const params = new URLSearchParams(window.location.search);
const remoteUsername = params.get("user") || "Unknown";
const roomName = params.get("room");

const remoteUserId = remoteUsername.split("_")[1];
const displayName = remoteUsername.split("_")[0];

document.getElementById("callUsername").textContent = displayName;
document.getElementById("profilePic").src = `/profiles/user${remoteUserId}.jpg`;

let peerConnection;
let localStream;
let remoteStream;
let callStartTime = new Date();

let servers = {
  iceServers: [{ urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302'] }]
};

const waitForIceGathering = (pc) => {
  return new Promise(resolve => {
    if (pc.iceGatheringState === "complete") return resolve();
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") resolve();
    });
  });
};

const setupLocalMedia = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;
};

const createPeerConnection = async () => {
  if (!localStream) {
    await setupLocalMedia();
  }
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById("remoteVideo").srcObject = remoteStream;

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", {
        offer: JSON.stringify({ type: 'candidate', candidate: event.candidate }),
        id: user.id
      });
    }
  };
};

const createOffer = async (toSid) => {
  if (!localStream) {
    await setupLocalMedia();
  }
  await createPeerConnection();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await waitForIceGathering(peerConnection);
  console.log("✅ Offer created")

  socket.emit("sendOffer", {
    offer: JSON.stringify({ type: 'offer', offer: peerConnection.localDescription }),
    toSid: toSid,
    room: roomName
  });
};

const createAnswer = async (remoteOffer, toSid) => {
  await createPeerConnection();
  if (!remoteStream) {
    remoteStream = new MediaStream();
    document.getElementById("remoteVideo").srcObject = remoteStream;
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(remoteOffer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  await waitForIceGathering(peerConnection);

  socket.emit("sendAnswer", {
    answer: JSON.stringify({ type: 'answer', answer: peerConnection.localDescription }),
    toSid: toSid,
    fromSid: user.id,
    room: roomName
  });
};

socket.on("connect", async () => {
  console.log("✅ Socket conectado en llamada");

  await setupLocalMedia();
  socket.emit("join_room", { room: roomName, username: user.username });
});

let peerSid = null;

socket.on("peer_joined", ({ sid }) => {
  peerSid = sid;
  console.log("✅ Peer joined with sid:", peerSid);
  setTimeout(() => createOffer(peerSid), 1000);
});

socket.on("offer", async ({ offer, fromSid }) => {
  console.log("✅ Received offer from:", fromSid);
  if (!localStream) {
    await setupLocalMedia();
  }
  const parsedOffer = JSON.parse(offer).offer;
  await createAnswer(parsedOffer, fromSid);
});

let callId;

socket.on("answer", async ({ answer, receiver_id }) => {
  console.log("✅ Received answer");
  const parsedAnswer = JSON.parse(answer).answer;
  if (peerConnection.signalingState !== "stable") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(parsedAnswer));
  }
  const request = await fetch(`${API_URL}/videoCalls/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caller_id: user.id,
      receiver_id: receiver_id,
      started_at: new Date().toISOString(),
    })
  });

  callId = (await request.json()).id;
});

socket.on("candidate", async ({ message }) => {
  if (peerConnection && message?.candidate) {
    try {
      await peerConnection.addIceCandidate(message.candidate);
    } catch (err) {
      console.error("❌ Error adding ICE:", err);
    }
  }
});

// Botones UI
let audioEnabled = true;
let videoEnabled = true;

document.getElementById("toggleMic").addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  localStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);
  document.getElementById("micIcon").textContent = audioEnabled ? "🔊" : "🔇";
});

document.getElementById("toggleCam").addEventListener("click", () => {
  videoEnabled = !videoEnabled;
  localStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
  document.getElementById("camIcon").textContent = videoEnabled ? "🎥" : "🚫";
});

document.getElementById("endCall").addEventListener("click", async () => {
  clearInterval(timerInterval);
  localStream?.getTracks().forEach(t => t.stop());
  peerConnection?.close();

  const end = new Date();
  const request = await fetch(`${API_URL}/videoCalls/${callId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ended_at: end.toISOString(),
    })
  });

  window.location.href = "main.html";
});

// Timer de llamada
const timerInterval = setInterval(() => {
  const elapsed = Math.floor((new Date() - callStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById("callDuration").textContent = `${minutes}:${seconds}`;
}, 1000);

loadNavbar();
