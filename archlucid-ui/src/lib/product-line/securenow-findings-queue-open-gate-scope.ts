export type SecureNowFindingsQueueOpenGateScopeParams = {
  readonly runId?: string | null;
  readonly architectureId?: string | null;
};

/** Preserve review scope when applying findings open-gate filter links. */
export function appendSecureNowFindingsQueueOpenGateScope(
  href: string,
  scope: SecureNowFindingsQueueOpenGateScopeParams,
): string {
  const questionIndex = href.indexOf("?");
  const path = questionIndex >= 0 ? href.slice(0, questionIndex) : href;
  const queryString = questionIndex >= 0 ? href.slice(questionIndex + 1) : "";
  const params = new URLSearchParams(queryString);

  const runId = scope.runId?.trim() ?? "";

  if (runId.length > 0) {
    params.set("runId", runId);
  }

  const architectureId = scope.architectureId?.trim() ?? "";

  if (architectureId.length > 0) {
    params.set("architectureId", architectureId);
  }

  const nextQuery = params.toString();

  if (nextQuery.length === 0) {
    return path;
  }

  return `${path}?${nextQuery}`;
}