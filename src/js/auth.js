// src/js/auth.js
import { API_URL} from './constantes';
import { io } from "socket.io-client";

export function setupAuthForms() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const socket = io(API_URL); 

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
          // Guardamos el token y los datos del usuario
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));

          socket.emit("user_logged_in", {
            id: data.user.id,
            username: data.user.username
          });

          console.log("Login exitoso:", data);
          window.location.href = "main.html";
        } else {
          alert(data.message || "Login fallido");
        }
      } catch (error) {
        console.error("Error en login:", error);
        alert("Error de red.");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = signupForm.querySelector('input[type="email"]').value;
      const password = signupForm.querySelector('input[type="password"]').value;
      const username = signupForm.querySelector('input[placeholder="Username"]').value;
      const firstName = signupForm.querySelector('input[placeholder="First Name"]').value;
      const lastName = signupForm.querySelector('input[placeholder="Last Name"]').value;

      try {
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
            username: username,
            first_name: firstName,
            last_name: lastName
          }),
        });

        const data = await res.json();
        if (res.ok) {
          console.log("Registro exitoso:", data);
          window.location.href = "index.html";
        } else {
          alert(data.message || "Signup fallido");
        }
      } catch (error) {
        console.error("Error en signup:", error);
        alert("Error de red.");
      }
    });
  }
}
