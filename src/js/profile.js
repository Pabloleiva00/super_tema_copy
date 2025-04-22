// src/js/profile.js
import { loadNavbar } from './load_navbar.js';
import { API_URL} from './constantes';

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

const editBtn = document.getElementById('editBtn');
const editForm = document.getElementById('editForm');
const submitEdit = document.getElementById('submitEdit');
const deleteBtn = document.getElementById('deleteBtn');
const usernameDisplay = document.getElementById('username');

loadNavbar();

// Load profile data on page load
async function loadProfile() {
  try {
    const userId = user.id || "1";

    // Actualizar los elementos del DOM con la información recibida
    document.getElementById('username').textContent = user.username || "Username";
    document.getElementById('profilePic').src = `/profiles/user${userId}.jpg`;
    document.getElementById('email').textContent = user.email || "Email";
    document.getElementById('name').textContent = user.first_name || "Name";
    document.getElementById('lastName').textContent = user.last_name || "Last Name";
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

// Toggle edit form
editBtn.addEventListener('click', () => {
  editForm.classList.toggle('hidden');
});

// Submit updated profile data
submitEdit.addEventListener('click', async () => {
  const newUsername = document.getElementById('newUserName').value.trim();
  const newEmail = document.getElementById('newEmail').value.trim();
  const newName = document.getElementById('newName').value.trim();
  const newLastName = document.getElementById('newLastName').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  const updateData = {};
  if (newUsername !== "") updateData.username = newUsername;
  if (newEmail !== "") updateData.email = newEmail;
  if (newName !== "") updateData.first_name = newName;
  if (newLastName !== "") updateData.last_name = newLastName;
  if (newPassword !== "") updateData.password = newPassword;

  try {
    const res = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (res.ok) {
      usernameDisplay.textContent = newUsername;
      if (updateData.username) document.getElementById('username').textContent = updateData.username;
      if (updateData.first_name) document.getElementById('name').textContent = updateData.first_name;
      if (updateData.last_name) document.getElementById('lastName').textContent = updateData.last_name;
      if (updateData.email) document.getElementById('email').textContent = updateData.email;
      alert('Profile updated successfully.');
      editForm.classList.add('hidden');
    } else {
      alert('Failed to update profile.');
    }
  } catch (err) {
    console.error('Update error:', err);
    alert('Error updating profile.');
  }
});

// Delete account
deleteBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete your account?')) return;

  try {
    const res = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      alert('Account deleted successfully.');
      window.location.href = '/html/index.html';
    } else {
      alert('Failed to delete account.');
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error deleting account.');
  }
});

loadProfile();