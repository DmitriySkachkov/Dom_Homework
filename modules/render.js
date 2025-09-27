import { comments } from './comments.js';
import { escapeHtml } from './utils.js';
import { toggleLike, replyToComment } from './event-handlers.js';

export function renderComments() {
  const commentsList = document.querySelector('.comments');
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
                    ${comment.isLikeLoading ? 'disabled' : ''}>
            </button>
          </div>
        </div>
      </li>
    `;
  });
  
  commentsList.innerHTML = commentsHTML;
  
  document.querySelectorAll('.like-button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const commentId = parseInt(event.target.dataset.id);
      toggleLike(commentId);
    });
  });
  
  document.querySelectorAll('.comment').forEach((commentElement) => {
    commentElement.addEventListener('click', (event) => {
      if (!event.target.closest('.like-button')) {
        const commentId = parseInt(commentElement.dataset.id);
        replyToComment(commentId);
      }
    });
  });
}