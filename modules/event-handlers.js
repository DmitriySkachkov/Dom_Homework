import { loadComments, postComment } from './api.js';
import { comments, updateComments, setReplyingToCommentId, setCurrentFormData, resetFormData } from './comments.js';
import { renderComments, renderApp, renderLoginForm, renderRegistrationForm } from './render.js';
import { delay } from './utils.js';
import { loginUser, registerUser, logout as authLogout, isLoggedIn } from './auth.js';

console.log('event-handlers.js загружен');

export function toggleLike(commentId) {
  console.log('toggleLike вызван для комментария:', commentId, 'тип:', typeof commentId);
  console.log('Пользователь авторизован:', isLoggedIn());
  
  if (!isLoggedIn()) {
    console.log('Пользователь не авторизован, показываем форму входа');
    showLoginForm();
    return;
  }

  // Ищем комментарий по строковому ID
  const comment = comments.find(c => c.id === commentId);
  console.log('Найден комментарий:', comment);
  
  if (comment && !comment.isLikeLoading) {
    console.log('Начинаем обработку лайка');
    comment.isLikeLoading = true;
    renderComments();
    
    delay(2000)
      .then(() => {
        console.log('Задержка завершена, обновляем лайки');
        comment.likes = comment.isLiked ? comment.likes - 1 : comment.likes + 1;
        comment.isLiked = !comment.isLiked;
        comment.isLikeLoading = false;
      })
      .then(() => {
        console.log('Рендерим комментарии после лайка');
        renderComments();
      })
      .catch((error) => {
        console.error('Ошибка при установке лайка:', error);
        comment.isLikeLoading = false;
        renderComments();
      });
  } else {
    console.log('Комментарий не найден или уже в процессе лайка');
  }
}

export function replyToComment(commentId) {
  console.log('replyToComment вызван для комментария:', commentId, 'тип:', typeof commentId);
  console.log('Пользователь авторизован:', isLoggedIn());
  
  if (!isLoggedIn()) {
    console.log('Пользователь не авторизован, показываем форму входа');
    showLoginForm();
    return;
  }

  // Ищем комментарий по строковому ID
  const comment = comments.find(c => c.id === commentId);
  console.log('Найден комментарий для ответа:', comment);
  
  const textInput = document.querySelector('.add-form-text');
  console.log('Поле ввода текста найдено:', textInput);
  
  if (comment && textInput) {
    console.log('Устанавливаем данные для ответа');
    setReplyingToCommentId(commentId);
    
    const replyText = `> ${comment.name}:\n> ${comment.text}\n\n`;
    console.log('Текст ответа:', replyText);
    
    textInput.value = replyText;
    setCurrentFormData({ text: replyText });
    textInput.focus();
    
    console.log('Ответ установлен в поле ввода');
  } else {
    console.log('Комментарий или поле ввода не найдены');
    console.log('Доступные комментарии:', comments.map(c => ({ id: c.id, type: typeof c.id })));
  }
}

// Глобальная функция для обработки кликов
window.handleCommentClick = function(event) {
  console.log('handleCommentClick вызван', event.target);
  
  // Обработка лайков
  if (event.target.classList.contains('like-button') || event.target.closest('.like-button')) {
    console.log('Клик по лайку');
    const likeButton = event.target.classList.contains('like-button') ? event.target : event.target.closest('.like-button');
    if (likeButton && !likeButton.disabled) {
      event.stopPropagation();
      // Берем ID как строку, не преобразуем в число
      const commentId = likeButton.dataset.id;
      console.log('ID комментария для лайка:', commentId, 'тип:', typeof commentId);
      toggleLike(commentId);
    }
    return;
  }
  
  // Обработка ответов на комментарии
  const commentElement = event.target.closest('.comment');
  if (commentElement) {
    console.log('Клик по комментарию', commentElement);
    // Берем ID как строку, не преобразуем в число
    const commentId = commentElement.dataset.id;
    console.log('ID комментария для ответа:', commentId, 'тип:', typeof commentId);
    replyToComment(commentId);
  }
};

function addNewComment() {
  console.log('addNewComment вызван');
  console.log('Пользователь авторизован:', isLoggedIn());
  
  if (!isLoggedIn()) {
    console.log('Пользователь не авторизован, показываем форму входа');
    showLoginForm();
    return;
  }

  const textInput = document.querySelector('.add-form-text');
  const addButton = document.querySelector('.add-form-button');
  
  let text = textInput.value.trim();
  console.log('Текст комментария:', text);
  
  if (text.length < 5) {
    console.log('Текст слишком короткий');
    alert('Комментарий должен содержать не менее 5 символов');
    return;
  }
  
  const originalText = addButton.textContent;
  addButton.disabled = true;
  addButton.textContent = 'Добавляем...';
  
  setCurrentFormData({ text });
  
  console.log('Отправка комментария...');
  postComment(text)
    .then(() => {
      console.log('Комментарий отправлен, загружаем обновленный список');
      return loadComments();
    })
    .then((updatedComments) => {
      console.log('Комментарии загружены:', updatedComments);
      updateComments(updatedComments);
      renderComments();
      textInput.value = '';
      resetFormData();
      console.log('Комментарий успешно добавлен');
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
      } else if (error.message === 'AUTH_ERROR') {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.');
        authLogout();
        renderApp();
      } else {
        alert(`Не удалось отправить комментарий: ${error.message}`);
      }
    })
    .finally(() => {
      addButton.disabled = false;
      addButton.textContent = originalText;
    });
}

function setupEventListeners() {
  console.log('Настройка обработчиков событий...');
  
  // Кнопка повторной загрузки
  const retryButton = document.getElementById('retry-button');
  if (retryButton) {
    console.log('Кнопка retry найдена');
    retryButton.addEventListener('click', handleRetry);
  } else {
    console.log('Кнопка retry не найдена');
  }

  // Форма добавления комментария
  const addButton = document.querySelector('.add-form-button');
  const textInput = document.querySelector('.add-form-text');
  
  if (addButton) {
    console.log('Кнопка добавления найдена');
    addButton.addEventListener('click', addNewComment);
  } else {
    console.log('Кнопка добавления не найдена');
  }
  
  if (textInput) {
    console.log('Поле ввода текста найдено');
    textInput.addEventListener('input', function() {
      setCurrentFormData({ text: this.value });
    });
    
    textInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addNewComment();
      }
    });
  }

  // Обработчики для комментариев (делегирование)
  const commentsContainer = document.querySelector('.comments-container') || document.querySelector('.comments');
  if (commentsContainer) {
    console.log('Контейнер комментариев найден, добавляем обработчик');
    commentsContainer.addEventListener('click', window.handleCommentClick);
  } else {
    console.log('Контейнер комментариев не найден');
  }

  // Кнопки авторизации
  const loginButton = document.querySelector('.login-button');
  const registerButton = document.querySelector('.register-button');
  const logoutButton = document.querySelector('.logout-button');
  const loginLink = document.querySelector('.login-link');
  const registerLink = document.querySelector('.register-link');
  
  if (loginButton) {
    console.log('Кнопка входа найдена');
    loginButton.addEventListener('click', showLoginForm);
  }
  if (registerButton) {
    console.log('Кнопка регистрации найдена');
    registerButton.addEventListener('click', showRegistrationForm);
  }
  if (logoutButton) {
    console.log('Кнопка выхода найдена');
    logoutButton.addEventListener('click', logout);
  }
  if (loginLink) {
    console.log('Ссылка входа найдена');
    loginLink.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
  }
  if (registerLink) {
    console.log('Ссылка регистрации найдена');
    registerLink.addEventListener('click', (e) => { e.preventDefault(); showRegistrationForm(); });
  }
  
  console.log('Обработчики событий настроены');
}

function handleRetry() {
  console.log('Повторная загрузка комментариев');
  const errorMessageElement = document.getElementById('error-message');
  const loadingElement = document.getElementById('loading');
  const commentsList = document.querySelector('.comments');
  
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

export function showLoginForm() {
  console.log('Показываем форму входа');
  renderLoginForm();
  setupAuthFormListeners();
}

export function showRegistrationForm() {
  console.log('Показываем форму регистрации');
  renderRegistrationForm();
  setupAuthFormListeners();
}

function setupAuthFormListeners() {
  console.log('Настройка обработчиков форм авторизации');
  
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const backButton = document.querySelector('.back-button');
  
  if (loginForm) {
    console.log('Форма входа найдена');
    loginForm.addEventListener('submit', handleLoginFormSubmit);
  }
  
  if (registerForm) {
    console.log('Форма регистрации найдена');
    registerForm.addEventListener('submit', handleRegisterFormSubmit);
  }
  
  if (backButton) {
    console.log('Кнопка назад найдена');
    backButton.addEventListener('click', () => {
      renderApp();
      setupEventListeners();
    });
  }
}

function handleLoginFormSubmit(event) {
  event.preventDefault();
  console.log('Отправка формы входа');
  
  const login = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  const button = event.target.querySelector('.submit-button');
  
  handleLogin(login, password, button, errorElement);
}

function handleRegisterFormSubmit(event) {
  event.preventDefault();
  console.log('Отправка формы регистрации');
  
  const login = document.getElementById('register-login').value;
  const name = document.getElementById('register-name').value;
  const password = document.getElementById('register-password').value;
  const errorElement = document.getElementById('register-error');
  const button = event.target.querySelector('.submit-button');
  
  handleRegister(login, name, password, button, errorElement);
}

async function handleLogin(login, password, button, errorElement) {
  console.log('Обработка входа:', login);
  
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Вход...';
  errorElement.style.display = 'none';

  try {
    await loginUser(login, password);
    console.log('Вход успешен');
    renderApp();
    setupEventListeners();
    initComments();
  } catch (error) {
    console.error('Ошибка входа:', error);
    errorElement.textContent = error.message;
    errorElement.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function handleRegister(login, name, password, button, errorElement) {
  console.log('Обработка регистрации:', login);
  
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Регистрация...';
  errorElement.style.display = 'none';

  try {
    await registerUser(login, name, password);
    console.log('Регистрация успешна');
    renderApp();
    setupEventListeners();
    initComments();
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    errorElement.textContent = error.message;
    errorElement.style.display = 'block';
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

export function logout() {
  console.log('Выход из системы');
  authLogout();
  renderApp();
  setupEventListeners();
}

function initComments() {
  console.log('Инициализация комментариев');
  
  const loadingElement = document.getElementById('loading');
  const commentsList = document.querySelector('.comments');
  const errorMessageElement = document.getElementById('error-message');
  
  if (loadingElement && commentsList && errorMessageElement) {
    loadingElement.style.display = 'block';
    commentsList.style.display = 'none';
    errorMessageElement.style.display = 'none';
    
    loadComments()
      .then((commentsData) => {
        console.log('Комментарии загружены:', commentsData);
        updateComments(commentsData);
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
  } else {
    console.log('Элементы комментариев не найдены');
  }
}

export function initApp() {
  console.log('Инициализация приложения');
  
  import('./auth.js').then(({ initAuth }) => {
    initAuth();
    renderApp();
    setupEventListeners();
    initComments();
  });
}