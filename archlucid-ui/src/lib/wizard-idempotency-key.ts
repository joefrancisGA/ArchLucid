const WIZARD_IDEMPOTENCY_STORAGE_KEY = "archlucid_wizard_idempotency_key_v1";
const WIZARD_REQUEST_ID_STORAGE_KEY = "archlucid_wizard_request_id_v1";

function createWizardRequestId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function readStorageValue(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(key)?.trim() ?? "";
  } catch {
    return "";
  }
}

function writeStorageValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore private mode */
  }
}

function removeStorageValue(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore private mode */
  }
}

/** Returns a stable idempotency key for the open new-review wizard session. */
export function getOrCreateWizardIdempotencyKey(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }

  const existing = readStorageValue(WIZARD_IDEMPOTENCY_STORAGE_KEY);

  if (existing.length > 0) {
    return existing;
  }

  const created = crypto.randomUUID();
  writeStorageValue(WIZARD_IDEMPOTENCY_STORAGE_KEY, created);

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

  const existing = readStorageValue(WIZARD_REQUEST_ID_STORAGE_KEY);

  if (existing.length > 0) {
    return existing;
  }

  const created = createWizardRequestId();
  writeStorageValue(WIZARD_REQUEST_ID_STORAGE_KEY, created);

  return created;
}

/** Clears wizard idempotency + request id after a successful submission. */
export function clearWizardSubmissionSession(): void {
  removeStorageValue(WIZARD_IDEMPOTENCY_STORAGE_KEY);
  removeStorageValue(WIZARD_REQUEST_ID_STORAGE_KEY);
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
