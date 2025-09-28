import { postComment, loadComments } from './api.js';
import { updateComments } from './comments.js';
import { renderComments } from './render.js';

const AUTH_STORAGE_KEY = 'commentAppUser';

export let currentUser = null;

export function initAuth() {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      updateUIForAuthState();
    } catch (error) {
      console.error('Ошибка при загрузке пользователя из localStorage:', error);
      logout();
    }
  } else {
    updateUIForAuthState();
  }
}

export function login(userData) {
  currentUser = userData;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  updateUIForAuthState();
}

export function logout() {
  currentUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  updateUIForAuthState();
  
  loadComments()
    .then((commentsData) => {
      updateComments(commentsData);
      renderComments();
    })
    .catch(error => {
      console.error('Ошибка при загрузке комментариев после выхода:', error);
    });
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function getCurrentUser() {
  return currentUser;
}

function updateUIForAuthState() {
  const addForm = document.querySelector('.add-form');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const userInfo = document.getElementById('user-info');
  const registerButton = document.getElementById('register-button');

  if (isLoggedIn()) {
    if (addForm) addForm.style.display = 'block';
    
    if (userInfo) {
      userInfo.textContent = `Вы вошли как: ${currentUser.user.name}`;
      userInfo.style.display = 'block';
    }
    
    if (logoutButton) logoutButton.style.display = 'inline-block';
    if (loginButton) loginButton.style.display = 'none';
    if (registerButton) registerButton.style.display = 'none';
  } else {
    if (addForm) addForm.style.display = 'none';
    
    if (userInfo) userInfo.style.display = 'none';
    
    if (loginButton) loginButton.style.display = 'inline-block';
    if (logoutButton) logoutButton.style.display = 'none';
    if (registerButton) registerButton.style.display = 'inline-block';
  }
}

export function validateToken() {
  if (!isLoggedIn()) return Promise.resolve(false);
  
  return Promise.resolve(true);
}