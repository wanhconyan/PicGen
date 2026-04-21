import { api } from '../services/api';

export function useExportActions() {
  return {
    createExport: (resultId: string, path = 'exports') => api.createExport({ resultId, path }),
    batchExport: (resultIds: string[], path = 'exports') => api.batchExport({ resultIds, path }),
  };
}
