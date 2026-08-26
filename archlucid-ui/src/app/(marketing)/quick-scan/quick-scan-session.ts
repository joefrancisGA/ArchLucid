import type { QuickScanFormFieldName } from "@/app/(marketing)/quick-scan/QuickScanForm";
import type { QuickScanFieldErrors } from "@/lib/quick-scan/quick-scan-validation";

export const QUICK_SCAN_SESSION_STORAGE_KEY = "al_quick_scan_session";
export const QUICK_SCAN_BROWSER_STORAGE_KEY = "al_quick_scan_browser";

export function ensureSessionId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(QUICK_SCAN_SESSION_STORAGE_KEY);

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(QUICK_SCAN_SESSION_STORAGE_KEY, created);

  return created;
}

export function ensureBrowserId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(QUICK_SCAN_BROWSER_STORAGE_KEY);

  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(QUICK_SCAN_BROWSER_STORAGE_KEY, created);

  return created;
}

export function tryReadErrorCode(body: string): string | null {
  if (body.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { errorCode?: unknown; extensions?: { errorCode?: unknown } };
    const direct = typeof parsed.errorCode === "string" ? parsed.errorCode : null;
    const nested =
      parsed.extensions && typeof parsed.extensions.errorCode === "string" ? parsed.extensions.errorCode : null;

    return direct ?? nested;
  } catch {
    return null;
  }
}

export function tryReadProblemDetail(body: string): string | null {
  if (body.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { detail?: unknown };

    return typeof parsed.detail === "string" && parsed.detail.trim().length > 0 ? parsed.detail : null;
  } catch {
    return null;
  }
}

export function environmentLabel(value: string): string {
  const labels: Record<string, string> = {
    Azure: "Azure",
    AWS: "AWS",
    GoogleCloud: "Google Cloud",
    Multicloud: "Multicloud",
    HybridCloud: "Hybrid cloud",
    OnPremises: "On-premises",
    ProviderNeutral: "Provider-neutral",
    Other: "Other",
    NotSure: "Not sure",
  };

  return labels[value] ?? value;
}

export function filterVisibleFieldErrors(
  errors: QuickScanFieldErrors,
  touchedFields: ReadonlySet<QuickScanFormFieldName>,
  attemptedSubmit: boolean,
): QuickScanFieldErrors {
  if (attemptedSubmit) {
    return errors;
  }

  const visible: QuickScanFieldErrors = {};

  if (touchedFields.has("systemName") && errors.systemName) {
    visible.systemName = errors.systemName;
  }

  if (touchedFields.has("primaryEnvironment") && errors.primaryEnvironment) {
    visible.primaryEnvironment = errors.primaryEnvironment;
  }

  if (touchedFields.has("description") && errors.description) {
    visible.description = errors.description;
  }

  if (touchedFields.has("architectureConcerns") && errors.architectureConcerns) {
    visible.architectureConcerns = errors.architectureConcerns;
  }

  return visible;
}
