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

if (Notification.permission !== "granted") {
  Notification.requestPermission().then((permission) => {
    console.log("Permiso de notificaciones:", permission);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();

  const createRoomBtn = document.getElementById("createRoom");
  const roomInfoDiv = document.getElementById("roomInfo");

  createRoomBtn?.addEventListener("click", () => {
    const roomName = prompt("Nombre de la sala:");
    if (roomName) {
      socket.emit("create_room", { room: roomName, username: user.username });
      socket.emit("join_room", { sid: user.id, room: roomName, username: user.username });
      window.location.href = `call.html?room=${roomName}&user=${user.username}_${user.id}`;
    }
  });

  socket.on("room_created", ({ room, username }) => {
    if (Notification.permission === "granted") {
      new Notification("📞 Nueva llamada", {
        body: `${username} ha iniciado una llamada en la sala ${room}`,
        icon: "/favicon.ico"
      });
    }
  
    const div = document.createElement("div");
    div.className = "bg-green-100 text-green-800 p-2 rounded shadow cursor-pointer hover:bg-green-200";
    div.textContent = `📞 ${username} ha iniciado una llamada en la sala ${room}`;
    div.addEventListener("click", () => {
      socket.emit("join_room", { room, username: user.username });
      window.location.href = `call.html?room=${room}&user=${username}_${user.id}`;
    });
  
    if (roomInfoDiv) {
      roomInfoDiv.classList.remove("hidden");
      roomInfoDiv.innerHTML = "";
      roomInfoDiv.appendChild(div);
    }
  });
  

  socket.connect();
});

document.addEventListener('DOMContentLoaded', async () => {
  const callHistoryContainer = document.getElementById('callHistory');
  if (callHistoryContainer) {
    const calls = await fetchCallHistory();
    console.log(calls);
    for (const { id, caller_id, receiver_id, started_at } of calls) {
      let id_other_user;
      if (caller_id == user.id) {
        id_other_user = receiver_id;
      } else {
        id_other_user = caller_id;
      }

      try {
        const response = await fetch(`${API_URL}/users/${id_other_user}`);
        const info_contacto = await response.json();

        const card = document.createElement('div');
        card.classList.add('cursor-pointer');
        card.addEventListener('click', () => {
          window.location.href = `call_detail.html?id=${id}`;
        });
        card.className = 'bg-orange-500 p-3 rounded-lg shadow-sm cursor-pointer';
        card.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="https://i.pravatar.cc/40?u=${encodeURIComponent(info_contacto.username)}" alt="User photo" class="w-10 h-10 rounded-full" />
          <div>
            <p class="text-sm font-medium text-white">${info_contacto.username}</p>
            <p class="text-xs text-white">${new Date(started_at).toLocaleString()}</p>
          </div>
        </div>
      `;
        callHistoryContainer.appendChild(card);
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
      }
    }
  }
});

// Función para obtener el historial de llamadas
export async function fetchCallHistory() {
  try {
    const response = await fetch(`${API_URL}/videoCalls/users/${user.id}`);
    if (!response.ok) throw new Error("Error al obtener historial");
    return await response.json(); 
  } catch (error) {
    console.log("Error al obtener historial de llamadas:", error);
  }
}

// Función para buscar usuarios
export async function searchUsers(query) {
  try {
    const response = await fetch(`${API_URL}/users/searchBy?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Error al buscar usuarios");
    return await response.json(); 
  } catch (error) {
    console.warn("Usando búsqueda dummy por error:", error.message);
    const allUsers = [
      "Clara Evans",
      "Samuel Adams",
      "Emma Johnson",
      "Michael Lee",
      "Jane Smith"
    ];
    return allUsers.filter(name =>
      name.toLowerCase().includes(query.toLowerCase())
    );
  }
}
