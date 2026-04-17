const STORAGE_KEY = "archlucid_trial_banner_snooze_until_ms";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

export function readTrialBannerSnoozedUntilMs(): number | null {
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

export function snoozeTrialBanner24h(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() + TWENTY_FOUR_H_MS));
  } catch {
    /* private mode */
  }
}

export function isTrialBannerSnoozed(nowMs: number = Date.now()): boolean {
  const until = readTrialBannerSnoozedUntilMs();

  if (until === null) {
    return false;
  }

  return nowMs < until;
}
