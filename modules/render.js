import { comments } from './comments.js';
import { escapeHtml } from './utils.js';
import { isLoggedIn, getUserName } from './auth.js';

export function renderComments() {
  console.log('renderComments вызван, комментариев:', comments.length);
  
  const commentsList = document.querySelector('.comments');
  
  if (!commentsList) {
    console.error('Элемент .comments не найден');
    return;
  }
  
  let commentsHTML = '';
  
  comments.forEach((comment) => {
    const formattedDate = comment.date instanceof Date 
      ? comment.date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : comment.date;
    
    const likeButtonClass = comment.isLiked ? '-active-like' : '';
    const loadingClass = comment.isLikeLoading ? '-loading-like' : '';
    const disabledAttr = comment.isLikeLoading ? 'disabled' : '';
    
    commentsHTML += `
      <li class="comment" data-id="${comment.id}">
        <div class="comment-header">
          <div>${escapeHtml(comment.name)}</div>
          <div>${formattedDate}</div>
        </div>
        <div class="comment-body">
          <div class="comment-text">
            ${escapeHtml(comment.text)}
          </div>
        </div>
        <div class="comment-footer">
          <div class="likes">
            <span class="likes-counter">${comment.likes}</span>
            <button class="like-button ${likeButtonClass} ${loadingClass}" 
                    data-id="${comment.id}"
                    ${disabledAttr}>
            </button>
          </div>
        </div>
      </li>
    `;
  });
  
  commentsList.innerHTML = commentsHTML;
  console.log('Комментарии отрендерены, HTML установлен');
}

export function renderApp() {
  console.log('renderApp вызван');
  
  const container = document.querySelector('.container');
  const userName = getUserName();
  
  container.innerHTML = `
    <div class="app-header">
      <h1>Проект "Комменты"</h1>
      <div class="user-info">
        ${isLoggedIn() 
          ? `<span>Привет, ${userName}!</span>
             <button class="logout-button" id="logout-btn">Выйти</button>`
          : `<div class="auth-buttons">
               <button class="login-button" id="login-btn">Войти</button>
               <button class="register-button" id="register-btn">Зарегистрироваться</button>
             </div>`
        }
      </div>
    </div>
    <div class="comments-container">
      <div id="loading" class="loading">Загрузка комментариев...</div>
      <ul class="comments" style="display: none;"></ul>
      <div id="error-message" class="error-message" style="display: none;">
        Не удалось загрузить комментарии. 
        <button id="retry-button">Попробовать снова</button>
      </div>
    </div>
    ${isLoggedIn() 
      ? `<div class="add-form">
          <textarea
            type="textarea"
            class="add-form-text"
            id="comment-text"
            name="comment-text"
            placeholder="Введите ваш комментарий"
            rows="4"
          ></textarea>
          <div class="add-form-row">
            <button class="add-form-button" id="add-comment-btn">Написать</button>
          </div>
        </div>`
      : `<div class="auth-required">
          <p>Чтобы добавить комментарий, пожалуйста, <a href="#" class="login-link" id="login-link">войдите</a> или <a href="#" class="register-link" id="register-link">зарегистрируйтесь</a>.</p>
        </div>`
    }
  `;

  console.log('Приложение отрендерено');
}

export function renderLoginForm() {
  console.log('renderLoginForm вызван');
  
  const container = document.querySelector('.container');
  
  container.innerHTML = `
    <div class="auth-form-container">
      <div class="auth-form">
        <h2>Вход</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="login-username">Логин:</label>
            <input 
              type="text" 
              id="login-username" 
              name="username"
              autocomplete="username"
              required
            >
          </div>
          <div class="form-group">
            <label for="login-password">Пароль:</label>
            <input 
              type="password" 
              id="login-password" 
              name="password"
              autocomplete="current-password"
              required
            >
          </div>
          <div class="form-buttons">
            <button type="submit" class="submit-button" id="login-submit-btn">Войти</button>
            <button type="button" class="back-button" id="login-back-btn">Назад</button>
          </div>
          <div class="auth-links">
            <p>Нет аккаунта? <a href="#" class="switch-to-register" id="switch-to-register">Зарегистрироваться</a></p>
          </div>
        </form>
        <div id="login-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `;

  console.log('Форма входа отрендерена');
}

export function renderRegistrationForm() {
  console.log('renderRegistrationForm вызван');
  
  const container = document.querySelector('.container');
  
  container.innerHTML = `
    <div class="auth-form-container">
      <div class="auth-form">
        <h2>Регистрация</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="register-login">Логин:</label>
            <input 
              type="text" 
              id="register-login" 
              name="login"
              autocomplete="username"
              required
            >
          </div>
          <div class="form-group">
            <label for="register-name">Имя:</label>
            <input 
              type="text" 
              id="register-name" 
              name="name"
              autocomplete="name"
              required
            >
          </div>
          <div class="form-group">
            <label for="register-password">Пароль:</label>
            <input 
              type="password" 
              id="register-password" 
              name="password"
              autocomplete="new-password"
              required
            >
          </div>
          <div class="form-buttons">
            <button type="submit" class="submit-button" id="register-submit-btn">Зарегистрироваться</button>
            <button type="button" class="back-button" id="register-back-btn">Назад</button>
          </div>
          <div class="auth-links">
            <p>Уже есть аккаунт? <a href="#" class="switch-to-login" id="switch-to-login">Войти</a></p>
          </div>
        </form>
        <div id="register-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `;

  console.log('Форма регистрации отрендерена');
}