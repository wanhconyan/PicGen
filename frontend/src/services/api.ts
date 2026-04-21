import { camelize, snakeify } from './serializers';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

type ApiResp<T> = {
  ok: boolean;
  data: T;
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const payload = (await response.json()) as ApiResp<T>;
  return camelize(payload.data);
}

export function q(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      sp.set(key, String(value));
    }
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  health: () => apiRequest<{ status: string }>('/health'),
  seedDemo: () => apiRequest<{ seeded: boolean }>('/seed/demo', { method: 'POST' }),
  getSettings: () => apiRequest<Record<string, unknown>>('/settings'),
  patchSettings: (payload: Record<string, unknown>) =>
    apiRequest('/settings', { method: 'PATCH', body: JSON.stringify(snakeify(payload)) }),

  listCharacters: (params: Record<string, string | number | undefined>) => apiRequest(`/characters${q(params)}`),
  createCharacter: (payload: Record<string, unknown>) =>
    apiRequest('/characters', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),

  listOutfits: (params: Record<string, string | number | undefined>) => apiRequest(`/outfits${q(params)}`),
  createOutfit: (payload: Record<string, unknown>) =>
    apiRequest('/outfits', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),

  listMasks: (params: Record<string, string | number | undefined>) => apiRequest(`/masks${q(params)}`),
  createMask: (payload: Record<string, unknown>) =>
    apiRequest('/masks', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),

  listBaseImages: (params: Record<string, string | number | undefined>) => apiRequest(`/base-images${q(params)}`),

  generate: (payload: Record<string, unknown>) =>
    apiRequest('/tasks/generate', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  localEdit: (payload: Record<string, unknown>) =>
    apiRequest('/tasks/local-edit', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  fullOutfitEdit: (payload: Record<string, unknown>) =>
    apiRequest('/tasks/full-outfit-edit', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  rework: (payload: Record<string, unknown>) =>
    apiRequest('/tasks/rework', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  listTasks: (params: Record<string, string | number | undefined>) => apiRequest(`/tasks${q(params)}`),

  listResults: (params: Record<string, string | number | undefined>) => apiRequest(`/results${q(params)}`),
  getResult: (id: string) => apiRequest(`/results/${id}`),

  listReviews: (params: Record<string, string | number | undefined>) => apiRequest(`/reviews${q(params)}`),
  reviewDecision: (payload: Record<string, unknown>) =>
    apiRequest('/reviews/decision', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  batchReviewDecision: (payload: Record<string, unknown>) =>
    apiRequest('/reviews/batch-decision', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  promoteBase: (payload: Record<string, unknown>) =>
    apiRequest('/reviews/promote-base', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),

  listExports: (params: Record<string, string | number | undefined>) => apiRequest(`/exports${q(params)}`),
  createExport: (payload: Record<string, unknown>) =>
    apiRequest('/exports/create', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),
  batchExport: (payload: Record<string, unknown>) =>
    apiRequest('/exports/batch-create', { method: 'POST', body: JSON.stringify(snakeify(payload)) }),

  getTaskTrace: (taskId: string) => apiRequest(`/traces/tasks/${taskId}`),
  getResultTrace: (resultId: string) => apiRequest(`/traces/results/${resultId}`),
  listLogs: (params: Record<string, string | number | undefined>) => apiRequest(`/logs${q(params)}`),
};
