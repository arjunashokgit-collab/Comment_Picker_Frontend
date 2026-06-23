import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'commentPickerToken';
const USER_KEY = 'commentPickerUser';

const allAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

const getStoredSessionToken = () => sessionStorage.getItem(TOKEN_KEY);

const getInstagramAuthConfig = () => {
  const token = getStoredSessionToken() || getStoredToken();

  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
};

export const setStoredAuth = ({ token, user }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getAPIErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return error.response?.data?.message || error.message || fallback;
};

allAPI.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

allAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => allAPI.post('/auth/register', userData),
  login: (credentials) => allAPI.post('/auth/login', credentials),
};

export const giveawayAPI = {
  create: (giveawayData) => allAPI.post('/giveaways/create', giveawayData),
  getAll: () => allAPI.get('/giveaways/all'),
  getById: (id) => allAPI.get(`/giveaways/${id}`),
  deleteById: (id) => allAPI.delete(`/giveaways/${id}`),
  addWinner: (id, winnerData) => allAPI.post(`/giveaways/${id}/winners`, winnerData),
  getWinners: (id) => allAPI.get(`/giveaways/${id}/winners`),
};

export const instagramAPI = {
  getProfile: () => allAPI.get('/instagram/profile', getInstagramAuthConfig()),
  getPosts: () => allAPI.get('/instagram/posts', getInstagramAuthConfig()),
  getComments: (mediaId) => {
    const requestUrl = `/instagram/comments/${mediaId}`;
    console.log('[allAPI] Instagram comments request URL:', `${API_BASE_URL}${requestUrl}`);

    return allAPI.get(requestUrl, getInstagramAuthConfig());
  },
};

export const registerAPI = authAPI.register;
export const loginAPI = authAPI.login;

export const createGiveawayAPI = giveawayAPI.create;
export const getAllGiveawaysAPI = giveawayAPI.getAll;
export const getGiveawayByIdAPI = giveawayAPI.getById;
export const deleteGiveawayAPI = giveawayAPI.deleteById;
export const addWinnerAPI = giveawayAPI.addWinner;
export const getWinnersAPI = giveawayAPI.getWinners;

export const getInstagramProfileAPI = instagramAPI.getProfile;
export const getInstagramPostsAPI = instagramAPI.getPosts;
export const getInstagramCommentsAPI = instagramAPI.getComments;

export default allAPI;
