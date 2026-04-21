import { api } from '../services/api';

export function useGenerateActions() {
  return {
    generate: (payload: Record<string, unknown>) => api.generate(payload),
    localEdit: (payload: Record<string, unknown>) => api.localEdit(payload),
    fullOutfitEdit: (payload: Record<string, unknown>) => api.fullOutfitEdit(payload),
    rework: (resultId: string, prompt = '') => api.rework({ resultId, prompt }),
  };
}
