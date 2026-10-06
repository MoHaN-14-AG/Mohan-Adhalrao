/**
 * API Client for SetuSeva CiRM.
 * Calls backend endpoints on /api/* (served by Django or Express middleware).
 */

const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('setuseva_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('setuseva_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('setuseva_token');
  localStorage.removeItem('setuseva_user');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const errData = await res.json();
      errMessage = errData.error || errData.detail || JSON.stringify(errData);
    } catch {
      errMessage = `HTTP error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errMessage);
  }

  return res.json();
}
