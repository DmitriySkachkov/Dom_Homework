import { delay } from './utils.js';

const host = "https://wedev-api.sky.pro/api/v1/dmitriy-skachkov";

export function loadComments() {
  return fetch(host + "/comments")
    .then((response) => {
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error('SERVER_ERROR');
        }
        throw new Error('Ошибка загрузки комментариев');
      }
      return response.json();
    })
    .then((data) => {
      return data.comments.map(comment => {
        return {
          id: comment.id,
          name: comment.author.name,
          date: new Date(comment.date),
          text: comment.text,
          likes: comment.likes,
          isLiked: false,
          isLikeLoading: false
        };
      });
    })
    .catch((error) => {
      if (error.message === 'Failed to fetch') {
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    });
}

export const postComment = (name, text, forceError = false, retryCount = 0) => {
  const bodyData = forceError 
    ? JSON.stringify({
        text: text,
        name: name,
        forceError: true
      })
    : JSON.stringify({
        text: text,
        name: name
      });

  return fetch(host + "/comments", {
    method: "POST",
    body: bodyData,
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 400) {
          return response.json().then(errorData => {
            throw new Error(`VALIDATION_ERROR:${errorData.error || 'Неверные данные'}`);
          });
        } else if (response.status >= 500) {
          if (retryCount < 3) {
            return delay(1000 * (retryCount + 1)).then(() => {
              return postComment(name, text, forceError, retryCount + 1);
            });
          }
          throw new Error('SERVER_ERROR');
        }
        return response.text().then(errorText => {
          throw new Error(`Ошибка сервера: ${response.status} ${errorText}`);
        });
      }
      return response.json();
    })
    .catch((error) => {
      if (error.message === 'Failed to fetch') {
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    });
};