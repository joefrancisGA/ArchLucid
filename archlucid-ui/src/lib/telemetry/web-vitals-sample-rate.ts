/**
 * Resolves Web Vitals App Insights sample rate (TB-692 / TB-2031 cost control).
 * Override with NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE (0–1). Default 0.25 at pilot+ scale.
 */
export const DEFAULT_WEB_VITALS_SAMPLE_RATE = 0.25;

export function resolveWebVitalsSampleRate(
  envValue: string | undefined = process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE,
): number {
  if (envValue === undefined || envValue.trim().length === 0) {
    return DEFAULT_WEB_VITALS_SAMPLE_RATE;
  }

  const parsed = Number(envValue);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_WEB_VITALS_SAMPLE_RATE;
  }

  if (parsed <= 0) {
    return 0;
  }

  if (parsed >= 1) {
    return 1;
  }

  return parsed;
}
