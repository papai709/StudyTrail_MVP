import api from "./client";

const unwrap = (response) => response.data?.data ?? response.data;

export const register = async (payload) => {
  const response = await api.post("/user/register", payload);
  return unwrap(response);
};

export const login = async (payload) => {
  const response = await api.post("/user/login", payload);
  return unwrap(response);
};

export const logout = async () => {
  const response = await api.post("/user/logout");
  return unwrap(response);
};

export const getCurrentUser = async () => {
  const response = await api.get("/user/current-user");
  return unwrap(response);
};
