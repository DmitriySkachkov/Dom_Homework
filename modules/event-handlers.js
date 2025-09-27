import { loadComments, postComment } from './api.js';
import { comments, updateComments, setReplyingToCommentId, setCurrentFormData, resetFormData } from './comments.js';
import { renderComments } from './render.js';
import { delay } from './utils.js';

const nameInput = document.querySelector('.add-form-name');
const textInput = document.querySelector('.add-form-text');
const addButton = document.querySelector('.add-form-button');
const commentsList = document.querySelector('.comments');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('error-message');
const retryButton = document.getElementById('retry-button');

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
  const comment = comments.find(c => c.id === commentId);
  
  if (comment) {
    setReplyingToCommentId(commentId);
    
    const replyText = `> ${comment.name}:\n> ${comment.text}\n\n`;
    
    nameInput.value = comment.name;
    textInput.value = replyText;
    
    setCurrentFormData({ name: comment.name, text: replyText });
    
    textInput.focus();
  }
}

function addNewComment() {
  const name = nameInput.value.trim();
  let text = textInput.value.trim();
  
  if (name.length < 3) {
    alert('Имя должно содержать не менее 3 символов');
    return;
  }
  
  if (text.length < 5) {
    alert('Комментарий должен содержать не менее 5 символов');
    return;
  }
  
  const originalText = addButton.textContent;
  addButton.disabled = true;
  addButton.textContent = 'Добавляем...';
  
  setCurrentFormData({ name, text });
  
  postComment(name, text)
    .then(() => {
      return loadComments();
    })
    .then((updatedComments) => {
      updateComments(updatedComments);
      renderComments();
      
      nameInput.value = '';
      textInput.value = '';
      resetFormData();
    })
    .catch((error) => {
      console.error('Ошибка при добавлении комментария:', error);
      
      nameInput.value = currentFormData.name;
      textInput.value = currentFormData.text;
      
      if (error.message === 'NETWORK_ERROR') {
        alert('Нет соединения с интернетом. Пожалуйста, проверьте подключение и попробуйте позже.');
      } else if (error.message.startsWith('VALIDATION_ERROR:')) {
        const errorMsg = error.message.split(':')[1];
        alert(`Ошибка валидации: ${errorMsg}`);
      } else if (error.message === 'SERVER_ERROR') {
        alert('Ошибка сервера. Пожалуйста, попробуйте позже.');
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
  retryButton.addEventListener('click', handleRetry);
  addButton.addEventListener('click', addNewComment);
  
  nameInput.addEventListener('input', function() {
    setCurrentFormData({ ...currentFormData, name: this.value });
  });
  
  textInput.addEventListener('input', function() {
    setCurrentFormData({ ...currentFormData, text: this.value });
  });
  
  textInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addNewComment();
    }
  });
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