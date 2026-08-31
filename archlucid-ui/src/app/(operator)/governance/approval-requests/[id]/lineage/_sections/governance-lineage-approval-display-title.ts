export function governanceLineageApprovalDisplayTitle(requestComment: string | null | undefined): string {
  const approvalTitle = (requestComment ?? "").trim();

  if (approvalTitle.length === 0) {
    return "Governance approval request";
  }

  if (approvalTitle.length > 80) {
    return `${approvalTitle.slice(0, 77)}…`;
  }

  return approvalTitle;
}
