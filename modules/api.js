import { delay } from './utils.js';
import { getCurrentUser } from './auth.js';

const host = "https://wedev-api.sky.pro/api/v2/dmitriy-skachkov";
const userHost = " https://wedev-api.sky.pro/api/user";

export function loginUser(login, password) {
  return fetch(userHost + "/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Ошибка авторизации');
        });
      }
      return response.json();
    });
}

export function registerUser(name, login, password) {
  return fetch(userHost, {
    method: "POST",
    body: JSON.stringify({
      name,
      login,
      password,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Ошибка регистрации');
        });
      }
      return response.json();
    });
}

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

export const postComment = (text, forceError = false, retryCount = 0) => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Пользователь не авторизован');
  }

  const bodyData = forceError 
    ? JSON.stringify({
        text: text,
        forceError: true
      })
    : JSON.stringify({
        text: text
      });

  return fetch(host + "/comments", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${user.token}`
    },
    body: bodyData,
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 400) {
          return response.json().then(errorData => {
            throw new Error(`VALIDATION_ERROR:${errorData.error || 'Неверные данные'}`);
          });
        } else if (response.status === 401) {
          throw new Error('AUTH_ERROR:Неверный токен авторизации');
        } else if (response.status >= 500) {
          if (retryCount < 3) {
            return delay(1000 * (retryCount + 1)).then(() => {
              return postComment(text, forceError, retryCount + 1);
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