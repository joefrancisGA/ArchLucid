/** Maps OpenAPI FindingHumanReviewStatus integers to operator-facing labels (TB-063). */
export function formatFindingHumanReviewStatusLabel(
  status: number | string | null | undefined,
): string {
  const numeric =
    typeof status === "number"
      ? status
      : typeof status === "string" && status.trim().length > 0
        ? Number.parseInt(status, 10)
        : Number.NaN;

  switch (numeric) {
    case 0:
      return "No human review required";
    case 1:
      return "Human review pending";
    case 2:
      return "Human review approved";
    case 3:
      return "Human review rejected";
    case 4:
      return "Human review overridden";
    default:
      return "Human review status unknown";
  }
}
