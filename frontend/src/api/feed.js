import api from "./client";

const unwrap = (response) => response.data?.data ?? response.data;

export const getPosts = async (page = 1, limit = 5) => {
  // Pass the page and limit as query parameters
  const response = await api.get(`/post/?page=${page}&limit=${limit}`);
  return unwrap(response);
};

export const createPost = async ({ text, file }) => {
  const formData = new FormData();
  // FIX: Map frontend 'text' to backend 'content'
  formData.append("content", text); 
  
  // FIX: Map frontend 'file' to backend 'attachments'
  if (file) formData.append("attachments", file); 

  const response = await api.post("/post/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
};

export const togglePostReaction = async (postId, reaction) => {
  const response = await api.post(`/like/toggle/post-id/${postId}`, { reaction });
  return unwrap(response);
};

export const createComment = async (postId, text) => {
  // 1. Send 'content' to the correct '/comment' route
  const response = await api.post(`/comment/${postId}`, {
    content: text
  });
  
  const data = unwrap(response);
  const rawComment = data?.comment ?? data;

  // 2. Map the backend fields to the frontend structure so Feed.jsx doesn't crash
  return {
    id: rawComment._id,
    text: rawComment.content,
    author: {
      name: rawComment.commentby?.fullName || "Student",
      handle: rawComment.commentby?.username ? `@${rawComment.commentby.username}` : "",
      avatarUrl: rawComment.commentby?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Student&backgroundColor=e2e8f0"
    }
  };
};

export const getComments = async (postId) => {
  const response = await api.get(`/comment/${postId}`);
  return unwrap(response);
};

export const getGoals = async () => {
  const response = await api.get("/goal/");
  return unwrap(response);
};

export const createGoal = async (payload) => {
  const formattedPayload = {
      title: payload.title,
      subject: payload.subject,
      deadline: payload.deadline,
      visibility: payload.isPublic ? "public" : "private",
  };

  const response = await api.post("/goal/", formattedPayload);

  return unwrap(response);
};

export const updateGoal = async (goalId) => {
  const response = await api.patch(`/goal/${goalId}`, {
      status: "completed",
  });

  return unwrap(response);
};

export const getSuggestedScholars = async () => {
  const response = await api.get("/user/recommendations");
  return unwrap(response);
};

export const sendConnectionRequest = async (receiverId) => {
  const response = await api.post(`/connection/request/${receiverId}`);
  return unwrap(response);
};

export const getPendingRequests = async () => {
  const response = await api.get("/connection/pending");
  return unwrap(response);
};

export const acceptConnectionRequest = async (requestId) => {
  const response = await api.patch(`/connection/accept/${requestId}`);
  return unwrap(response);
};

export const removeConnection = async (requestId) => {
  const response = await api.delete(`/connection/remove/${requestId}`);
  return unwrap(response);
};


export const getMyNetworkStreaks = async () => {
  const response = await api.get("/gamification/network-streaks");
  return unwrap(response);
};
