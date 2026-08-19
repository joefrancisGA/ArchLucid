const RESEND_COOLDOWN_MS = 45_000;
const RESEND_STORAGE_KEY = "archlucid_email_otp_resend_until_ms";

export type EmailOtpResendCooldown = {
  readonly active: boolean;
  readonly secondsRemaining: number;
};

export function readEmailOtpResendCooldown(nowMs: number = Date.now()): EmailOtpResendCooldown {
  if (typeof window === "undefined") {
    return { active: false, secondsRemaining: 0 };
  }

  try {
    const raw = window.sessionStorage.getItem(RESEND_STORAGE_KEY);

    if (raw === null || raw.length === 0) {
      return { active: false, secondsRemaining: 0 };
    }

    const untilMs = Number(raw);

    if (!Number.isFinite(untilMs) || untilMs <= nowMs) {
      return { active: false, secondsRemaining: 0 };
    }

    return {
      active: true,
      secondsRemaining: Math.ceil((untilMs - nowMs) / 1000),
    };
  } catch {
    return { active: false, secondsRemaining: 0 };
  }
}

export function markEmailOtpResendSent(nowMs: number = Date.now()): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(RESEND_STORAGE_KEY, String(nowMs + RESEND_COOLDOWN_MS));
  } catch {
    /* private mode */
  }
}

export function emailOtpResendCooldownMs(): number {
  return RESEND_COOLDOWN_MS;
}
