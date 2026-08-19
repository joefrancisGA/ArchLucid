export type SaveTenantReviewCycleBaselineInput = {
  baselineReviewCycleHours: number;
  baselineReviewCycleSourceNote: string | null;
};

export type SaveTenantReviewCycleBaselineResult =
  | { ok: true }
  | { ok: false; message: string };

/** Persists review-cycle baseline hours via `PUT /v1/tenant/baseline` (shared with settings + PilotBaselineWizard). */
export async function saveTenantReviewCycleBaseline(
  input: SaveTenantReviewCycleBaselineInput,
): Promise<SaveTenantReviewCycleBaselineResult> {
  const response = await fetch("/api/proxy/v1/tenant/baseline", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({
      baselineReviewCycleHours: input.baselineReviewCycleHours,
      baselineReviewCycleSourceNote: input.baselineReviewCycleSourceNote,
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  const text = await response.text();
  let message = text.length > 0 ? text : `Request failed (${response.status})`;

  try {
    const parsed = JSON.parse(text) as { detail?: string };

    if (typeof parsed.detail === "string" && parsed.detail.length > 0) {
      message = parsed.detail;
    }
  } catch {
    /* ignore */
  }

  return { ok: false, message };
}

export function parseWizardBaselineReviewCycleHours(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return value;
}

export function validateWizardBaselineReviewCycleHours(raw: string): string | null {
  const hours = parseWizardBaselineReviewCycleHours(raw);

  if (hours === null) {
    return null;
  }

  if (Number.isNaN(hours)) {
    return "Review cycle time must be a positive number.";
  }

  if (hours <= 0 || hours > 10_000) {
    return "Review cycle time must be between 0 and 10,000 (exclusive of zero).";
  }

  return null;
}

export function validateMandatoryWizardBaselineReviewCycleHours(raw: string): string | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return validateWizardBaselineReviewCycleHours(raw);
}

/** Returns persisted review-cycle hours when the tenant already captured a baseline. */
export async function getTenantReviewCycleBaselineHours(): Promise<number | null> {
  const response = await fetch("/api/proxy/v1/tenant/baseline", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { baselineReviewCycleHours?: unknown };
  const hours = data.baselineReviewCycleHours;

  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) {
    return null;
  }

  return hours;
}
