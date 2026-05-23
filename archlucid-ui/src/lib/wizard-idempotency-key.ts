const WIZARD_IDEMPOTENCY_SESSION_KEY = "archlucid_wizard_idempotency_key_v1";

/** Returns a stable idempotency key for the open new-review wizard session. */
export function getOrCreateWizardIdempotencyKey(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }

  try {
    const existing = window.sessionStorage.getItem(WIZARD_IDEMPOTENCY_SESSION_KEY)?.trim() ?? "";

    if (existing.length > 0) {
      return existing;
    }

    const created = crypto.randomUUID();
    window.sessionStorage.setItem(WIZARD_IDEMPOTENCY_SESSION_KEY, created);

    return created;
  } catch {
    return crypto.randomUUID();
  }
}

/** Clears the wizard idempotency key after a successful submission. */
export function clearWizardIdempotencyKey(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(WIZARD_IDEMPOTENCY_SESSION_KEY);
  } catch {
    /* ignore private mode */
  }
}
