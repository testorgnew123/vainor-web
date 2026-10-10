const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';

interface ApiOptions {
  token?: string;
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
}

export async function apiCall(endpoint: string, data?: any, options?: ApiOptions) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: options?.method || 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}