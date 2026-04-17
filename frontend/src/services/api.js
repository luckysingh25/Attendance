import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Centrally managed base URL from src/config/api.js
export const BASE_URL = API_BASE_URL;

const getHeaders = async (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const token = await AsyncStorage.getItem('@atd_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token', error);
  }
  return headers;
};

export const registerTeacher = async (name, email, password) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

export const loginTeacher = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const loginStudent = async (erp, dob) => {
  const response = await fetch(`${BASE_URL}/students/login`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ erp, dob }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const uploadPhoto = async (erp, photoUri, matchMimeType) => {
  const formData = new FormData();
  formData.append('erp', erp);
  formData.append('photo', {
    uri: photoUri,
    type: matchMimeType || 'image/jpeg',
    name: 'photo.jpg',
  });

  const response = await fetch(`${BASE_URL}/students/upload-photo`, {
    method: 'POST',
    headers: await getHeaders(true),
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Photo upload failed');
  return data;
};

export const startSession = async (eventId) => {
  const response = await fetch(`${BASE_URL}/sessions/start`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ eventId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to start session');
  return data;
};

export const refreshToken = async (sessionId) => {
  const response = await fetch(`${BASE_URL}/sessions/refresh-token`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to refresh token');
  return data;
};

export const validateToken = async (token, eventId) => {
  const response = await fetch(`${BASE_URL}/sessions/validate`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ token, eventId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invalid or expired token');
  return data;
};

export const markAttendance = async (sessionId, eventId) => {
  const response = await fetch(`${BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ sessionId, eventId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark attendance');
  return data;
};

export const getHistory = async () => {
  const response = await fetch(`${BASE_URL}/attendance/history`, {
    method: 'GET',
    headers: await getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
  return data;
};

export const getAllLogs = async (eventId = '') => {
  const url = eventId ? `${BASE_URL}/attendance/all?eventId=${eventId}` : `${BASE_URL}/attendance/all`;
  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch logs');
  return data;
};
