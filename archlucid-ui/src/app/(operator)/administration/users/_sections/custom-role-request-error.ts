/**
 * Failure from an admin roles request. The HTTP status is carried separately so buyer-facing copy can
 * be chosen from it without printing the status code into the UI.
 */
export class CustomRoleRequestError extends Error {
  readonly status: number | null;

  constructor(status: number | null) {
    super(`Admin roles request failed (${status ?? "no response"}).`);
    this.name = "CustomRoleRequestError";
    this.status = status;
  }
}

/** HTTP status behind a caught error, or null for network failures and unexpected error shapes. */
export function customRoleRequestStatus(error: unknown): number | null {
  if (error instanceof CustomRoleRequestError)
    return error.status;

  return null;
}
