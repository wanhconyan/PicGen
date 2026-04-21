import { api } from '../services/api';

export function useReviewActions() {
  return {
    approve: (resultId: string, comment = '') => api.reviewDecision({ resultId, decision: 'approve', comment }),
    reject: (resultId: string, comment = '') => api.reviewDecision({ resultId, decision: 'reject', comment }),
    batchApprove: (resultIds: string[]) => api.batchReviewDecision({ resultIds, decision: 'approve' }),
    batchReject: (resultIds: string[]) => api.batchReviewDecision({ resultIds, decision: 'reject' }),
    promoteToBase: (resultId: string) => api.promoteBase({ resultId }),
  };
}
