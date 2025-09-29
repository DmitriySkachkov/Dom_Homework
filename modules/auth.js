import { renderApp } from './render.js';

const AUTH_STORAGE_KEY = 'userData';

export let currentUser = null;

export function initAuth() {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {
      console.error('Ошибка при загрузке пользователя из localStorage:', e);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
}

export function saveUser(user) {
  currentUser = user;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function logout() {
  currentUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function getUserToken() {
  return currentUser ? currentUser.token : null;
}

export function getUserName() {
  return currentUser ? currentUser.name : '';
}

export async function registerUser(login, name, password) {
  try {
    console.log('Отправка данных регистрации:', { login, name, password });
    
    const response = await fetch('https://wedev-api.sky.pro/api/user', {
      method: 'POST',
      // Убираем все заголовки для этого API
      body: JSON.stringify({
        login: login.trim(),
        name: name.trim(),
        password: password.trim()
      }),
    });

    console.log('Статус ответа:', response.status);

    if (!response.ok) {
      let errorMessage = 'Ошибка регистрации';
      
      if (response.status === 400) {
        const errorData = await response.json().catch(() => null);
        errorMessage = errorData?.error || 'Пользователь с таким логином уже существует';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Успешная регистрация:', data);
    saveUser(data.user);
    return data.user;
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Нет соединения с интернетом');
    }
    throw error;
  }
}

export async function loginUser(login, password) {
  try {
    console.log('Отправка данных авторизации:', { login, password });
    
    const response = await fetch('https://wedev-api.sky.pro/api/user/login', {
      method: 'POST',
      // Убираем все заголовки для этого API
      body: JSON.stringify({
        login: login.trim(),
        password: password.trim()
      }),
    });

    console.log('Статус ответа:', response.status);

    if (!response.ok) {
      let errorMessage = 'Ошибка авторизации';
      
      if (response.status === 400) {
        errorMessage = 'Неверный логин или пароль';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Успешная авторизация:', data);
    saveUser(data.user);
    return data.user;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Нет соединения с интернетом');
    }
    throw error;
  }
}