export let comments = [];
export let replyingToCommentId = null;
export let currentFormData = { name: '', text: '' };

export function updateComments(newComments) {
  comments = newComments;
}

export function setReplyingToCommentId(commentId) {
  replyingToCommentId = commentId;
}

export function setCurrentFormData(data) {
  currentFormData = data;
}

export function resetFormData() {
  currentFormData = { name: '', text: '' };
  replyingToCommentId = null;
}