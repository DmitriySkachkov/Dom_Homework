export let comments = [];
export let replyingToCommentId = null;
export let currentFormData = { text: '' };

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
  currentFormData = { text: '' };
  replyingToCommentId = null;
}