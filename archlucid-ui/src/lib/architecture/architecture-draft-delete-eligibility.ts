export function canDeleteArchitectureDraft(input: {
  readonly linkedReviewId: string | null;
  readonly customerStatus?: "draft" | "ready-for-review" | "archived";
  readonly serverStatus?: string | null;
}): boolean {
  if (input.linkedReviewId !== null) {
    return false;
  }

  if (input.customerStatus === "archived") {
    return false;
  }

  if (input.serverStatus === undefined || input.serverStatus === null) {
    return true;
  }

  return input.serverStatus === "Drafting" || input.serverStatus === "Admitted";
}
