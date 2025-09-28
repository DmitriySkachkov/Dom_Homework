import { loadComments, postComment, loginUser, registerUser } from './api.js';
import { comments, updateComments, setReplyingToCommentId, setCurrentFormData, resetFormData } from './comments.js';
import { renderComments } from './render.js';
import { delay } from './utils.js';
import { login, logout, isLoggedIn, getCurrentUser, initAuth } from './auth.js';

const nameInput = document.querySelector('.add-form-name');
const textInput = document.querySelector('.add-form-text');
const addButton = document.querySelector('.add-form-button');
const commentsList = document.querySelector('.comments');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('error-message');
const retryButton = document.getElementById('retry-button');

const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const registerButton = document.getElementById('register-button');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

export function toggleLike(commentId) {
  const comment = comments.find(c => c.id === commentId);
  
  if (comment && !comment.isLikeLoading) {
    comment.isLikeLoading = true;
    renderComments();
    
    delay(2000)
      .then(() => {
        comment.likes = comment.isLiked ? comment.likes - 1 : comment.likes + 1;
        comment.isLiked = !comment.isLiked;
        comment.isLikeLoading = false;
        return comment;
      })
      .then(() => {
        renderComments();
      })
      .catch((error) => {
        console.error('Ошибка при установке лайка:', error);
        comment.isLikeLoading = false;
        renderComments();
      });
  }
}

export function replyToComment(commentId) {
  if (!isLoggedIn()) {
    showLoginModal();
    return;
  }

  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    setReplyingToCommentId(commentId);
    
    const replyText = `> ${comment.name}:\n> ${comment.text}\n\n`;
    
    textInput.value = replyText;
    
    setCurrentFormData({ text: replyText });
    
    textInput.focus();
  }
}

function addNewComment() {
  if (!isLoggedIn()) {
    showLoginModal();
    return;
  }

  let text = textInput.value.trim();
  
  if (text.length < 5) {
    alert('Комментарий должен содержать не менее 5 символов');
    return;
  }
  
  const originalText = addButton.textContent;
  addButton.disabled = true;
  addButton.textContent = 'Добавляем...';
  
  setCurrentFormData({ text });
  
  postComment(text)
    .then(() => {
      return loadComments();
    })
    .then((updatedComments) => {
      updateComments(updatedComments);
      renderComments();
      
      textInput.value = '';
      resetFormData();
    })
    .catch((error) => {
      console.error('Ошибка при добавлении комментария:', error);
      
      textInput.value = currentFormData.text;
      
      if (error.message === 'NETWORK_ERROR') {
        alert('Нет соединения с интернетом. Пожалуйста, проверьте подключение и попробуйте позже.');
      } else if (error.message.startsWith('VALIDATION_ERROR:')) {
        const errorMsg = error.message.split(':')[1];
        alert(`Ошибка валидации: ${errorMsg}`);
      } else if (error.message === 'SERVER_ERROR') {
        alert('Ошибка сервера. Пожалуйста, попробуйте позже.');
      } else if (error.message.startsWith('AUTH_ERROR:')) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        logout();
      } else {
        alert(`Не удалось отправить комментарий: ${error.message}`);
      }
    })
    .finally(() => {
      addButton.disabled = false;
      addButton.textContent = originalText;
    });
}

function showLoginModal() {
  loginModal.style.display = 'block';
}

function showRegisterModal() {
  registerModal.style.display = 'block';
}

function hideModals() {
  loginModal.style.display = 'none';
  registerModal.style.display = 'none';
}

function handleLogin(event) {
  event.preventDefault();
  
  const loginError = document.getElementById('login-error');
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  loginError.style.display = 'none';
  
  loginUser(username, password)
    .then((userData) => {
      login(userData);
      hideModals();
      loginForm.reset();
      
      return loadComments();
    })
    .then((commentsData) => {
      updateComments(commentsData);
      renderComments();
    })
    .catch((error) => {
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    });
}

function handleRegister(event) {
  event.preventDefault();
  
  const registerError = document.getElementById('register-error');
  const name = document.getElementById('register-name').value;
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  
  registerError.style.display = 'none';
  
  registerUser(name, username, password)
    .then((userData) => {
      login(userData);
      hideModals();
      registerForm.reset();
      alert('Регистрация прошла успешно!');
      
      return loadComments();
    })
    .then((commentsData) => {
      updateComments(commentsData);
      renderComments();
    })
    .catch((error) => {
      registerError.textContent = error.message;
      registerError.style.display = 'block';
    });
}

function setupEventListeners() {
  retryButton.addEventListener('click', handleRetry);
  addButton.addEventListener('click', addNewComment);
  
  textInput.addEventListener('input', function() {
    setCurrentFormData({ text: this.value });
  });
  
  textInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addNewComment();
    }
  });
  
  loginButton.addEventListener('click', showLoginModal);
  logoutButton.addEventListener('click', logout);
  registerButton.addEventListener('click', showRegisterModal);
  
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', hideModals);
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      hideModals();
    }
    if (event.target === registerModal) {
      hideModals();
    }
  });
  
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
}

function handleRetry() {
  errorMessageElement.style.display = 'none';
  loadingElement.style.display = 'block';
  
  loadComments()
    .then((commentsData) => {
      updateComments(commentsData);
      renderComments();
      loadingElement.style.display = 'none';
      commentsList.style.display = 'block';
    })
    .catch((error) => {
      console.error('Ошибка при повторной загрузке:', error);
      loadingElement.style.display = 'none';
      
      if (error.message === 'NETWORK_ERROR') {
        errorMessageElement.textContent = 'Нет соединения с интернетом. Пожалуйста, проверьте подключение.';
      } else {
        errorMessageElement.textContent = 'Не удалось загрузить комментарии: ' + error.message;
      }
      
      errorMessageElement.style.display = 'block';
    });
}

export function initApp() {
  initAuth();
  
  loadingElement.style.display = 'block';
  commentsList.style.display = 'none';
  errorMessageElement.style.display = 'none';
  
  loadComments()
    .then((commentsData) => {
      updateComments(commentsData);
      return commentsData;
    })
    .then(() => {
      renderComments();
      loadingElement.style.display = 'none';
      commentsList.style.display = 'block';
    })
    .catch((error) => {
      console.error('Ошибка загрузки комментариев:', error);
      loadingElement.style.display = 'none';
      
      if (error.message === 'NETWORK_ERROR') {
        errorMessageElement.textContent = 'Нет соединения с интернетом. Пожалуйста, проверьте подключение.';
      } else if (error.message === 'SERVER_ERROR') {
        errorMessageElement.textContent = 'Ошибка сервера. Пожалуйста, попробуйте позже.';
      } else {
        errorMessageElement.textContent = 'Не удалось загрузить комментарии: ' + error.message;
      }
      
      errorMessageElement.style.display = 'block';
    });
  
  setupEventListeners();
}