/** Maps approval workflow API status strings to buyer-facing labels (BDA-120). */
export function buyerGovernanceWorkflowStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();

  switch (normalized) {
    case "submitted":
    case "pending":
      return "Pending architecture review";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "withdrawn":
      return "Withdrawn";

    default:
      return status.trim().length > 0 ? status : "Unknown";
  }
}
