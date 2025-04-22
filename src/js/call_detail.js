import { loadNavbar } from './load_navbar.js';
import { API_URL} from './constantes';

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

const params = new URLSearchParams(window.location.search);
const callId = params.get("id");

const callerName = document.getElementById("callerName");
const receiverName = document.getElementById("receiverName");
const startTime = document.getElementById("startTime");
const finishTime = document.getElementById("finishTime");
const duration = document.getElementById("duration");
const status = document.getElementById("status");

loadNavbar();

async function fetchCallDetails(id) {
  try {
    const usuarios_llamada = await fetch(`${API_URL}/users`);
    const data_usuarios = await usuarios_llamada.json();

    const res = await fetch(`${API_URL}/videoCalls/${id}`);
    if (!res.ok) throw new Error("Error al obtener llamada");

    const data = await res.json();
    const llamador = data_usuarios.find(u => u.id == data.caller_id);
    const recibidor = data_usuarios.find(u => u.id == data.receiver_id);

    const startedAt = new Date(data.started_at);
    const endedAt = new Date(data.ended_at);

    // Calcular la diferencia en milisegundos
    const durationInMilliseconds = endedAt - startedAt;

    // Convertir la duración a segundos
    const durationInSeconds = Math.floor(durationInMilliseconds / 1000);

    // Calcular los minutos y los segundos
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;

    // Formatear el tiempo como "X min Y sec"
    data.duration = `${minutes}m ${seconds}s`;

    callerName.textContent = `${llamador.username}`;
    receiverName.textContent = `${recibidor.username}`;
    startTime.textContent = new Date(data.started_at).toLocaleString();
    finishTime.textContent = new Date(data.ended_at).toLocaleString();
    duration.textContent = data.duration || "-";
    status.textContent = data.status || "-";
  } catch (err) {
    console.error("Error al obtener detalles de llamada:", err);
    callerName.textContent = "Error";
    receiverName.textContent = "Error";
  }
}

if (callId) {
  fetchCallDetails(callId);
} else {
  callerName.textContent = "Missing ID";
  receiverName.textContent = "Missing ID";
}
