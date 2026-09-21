const STORAGE_KEY = "archlucid_trial_expiry_banner_snooze_until_ms";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

export function readTrialExpiryBannerSnoozedUntilMs(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === null || raw.length === 0) {
      return null;
    }

    const n = Number(raw);

    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function snoozeTrialExpiryBanner24h(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() + TWENTY_FOUR_H_MS));
  } catch {
    /* private mode */
  }
}

export function isTrialExpiryBannerSnoozed(nowMs: number = Date.now()): boolean {
  const until = readTrialExpiryBannerSnoozedUntilMs();

  if (until === null) {
    return false;
  }

  return nowMs < until;
}
