/** POST /v1/governance/approval-requests/batch-review item row */
export interface GovernanceBatchReviewItemResult {
  approvalRequestId?: string;
  succeeded?: boolean;
  errorCode?: string | null;
  message?: string | null;
}

/** POST /v1/governance/approval-requests/batch-review */
export interface GovernanceBatchReviewResponse {
  results?: GovernanceBatchReviewItemResult[];
}
