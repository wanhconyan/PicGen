import { api } from '../services/api';

type ExportOptions = {
  includeMetadata: boolean;
  includeManifest: boolean;
  includeThumbnail: boolean;
};

const defaultOptions: ExportOptions = {
  includeMetadata: true,
  includeManifest: true,
  includeThumbnail: false,
};

export function useExportActions() {
  return {
    createExport: (resultId: string, path = 'exports', options: ExportOptions = defaultOptions) =>
      api.createExport({ resultId, path, ...options }),
    batchExport: (resultIds: string[], path = 'exports', options: ExportOptions = defaultOptions) =>
      api.batchExport({ resultIds, path, ...options }),
  };
}
