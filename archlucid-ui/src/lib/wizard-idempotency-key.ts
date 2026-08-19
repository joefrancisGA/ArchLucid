const WIZARD_IDEMPOTENCY_SESSION_KEY = "archlucid_wizard_idempotency_key_v1";
const WIZARD_REQUEST_ID_SESSION_KEY = "archlucid_wizard_request_id_v1";

function createWizardRequestId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function readSessionValue(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.sessionStorage.getItem(key)?.trim() ?? "";
  } catch {
    return "";
  }
}

function writeSessionValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore private mode */
  }
}

function removeSessionValue(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore private mode */
  }
}

/** Returns a stable idempotency key for the open new-review wizard session. */
export function getOrCreateWizardIdempotencyKey(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }

  const existing = readSessionValue(WIZARD_IDEMPOTENCY_SESSION_KEY);

  if (existing.length > 0) {
    return existing;
  }

  const created = crypto.randomUUID();
  writeSessionValue(WIZARD_IDEMPOTENCY_SESSION_KEY, created);

  return created;
}

/**
 * Returns a stable architecture request id for the open wizard session.
 * Must stay paired with {@link getOrCreateWizardIdempotencyKey} so create-run retries fingerprint the same body.
 */
export function getOrCreateWizardRequestId(): string {
  if (typeof window === "undefined") {
    return createWizardRequestId();
  }

  const existing = readSessionValue(WIZARD_REQUEST_ID_SESSION_KEY);

  if (existing.length > 0) {
    return existing;
  }

  const created = createWizardRequestId();
  writeSessionValue(WIZARD_REQUEST_ID_SESSION_KEY, created);

  return created;
}

/** Clears wizard idempotency + request id after a successful submission. */
export function clearWizardSubmissionSession(): void {
  removeSessionValue(WIZARD_IDEMPOTENCY_SESSION_KEY);
  removeSessionValue(WIZARD_REQUEST_ID_SESSION_KEY);
}

/** @deprecated Use {@link clearWizardSubmissionSession}. */
export function clearWizardIdempotencyKey(): void {
  clearWizardSubmissionSession();
}

/** Issues fresh wizard idempotency + request ids after a body-mismatch conflict. */
export function rotateWizardSubmissionSession(): void {
  clearWizardSubmissionSession();
  getOrCreateWizardIdempotencyKey();
  getOrCreateWizardRequestId();
}
