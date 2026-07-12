import api from "./client";

const unwrap = (response) => response.data?.data ?? response.data;

export const getMyProfile = async () => {
  const response = await api.get("/user/current-user");
  return unwrap(response);
};

export const completeMyProfile = async (payload) => {
  const formData = new FormData();
  
  // Dynamically append all text fields and files to FormData
  Object.keys(payload).forEach(key => {
    if (payload[key]) {
      formData.append(key, payload[key]);
    }
  });

  // FIX: Changed .post to .patch to match the backend route
  const response = await api.patch("/user/complete-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
};

export const updateMyProfile = async (payload) => {
  // FIX: Changed from .post to .patch to match backend routes
  const response = await api.patch("/user/update-account", payload);
  return unwrap(response);
};

export const uploadProfileImage = async (type, file) => {
  const formData = new FormData();
  
  // Backend expects field name 'profileImage' or 'coverImage'
  const fieldName = type === 'cover' ? 'coverImage' : 'profileImage';
  formData.append(fieldName, file);

  // Route to the correct backend endpoint
  const endpoint = type === 'cover' ? '/user/update-cover-image' : '/user/update-profile-image';

  // FIX: Changed from .post to .patch
  const response = await api.patch(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
};

export const getMyStats = async () => {
  const response = await api.get("/gamification/my-stats");
  return unwrap(response);
};

export const getMyConnections = async () => {
  const response = await api.get("/connection/my-network");
  return unwrap(response);
};

export const getMyPosts = async () => {
  const response = await api.get("/post/my-posts");
  return unwrap(response);
};