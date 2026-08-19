/**
 * Server-side request timing helpers for Next.js BFF routes (proxy-first).
 * Emits Server-Timing for browser DevTools and structured logs for operators.
 */

export type ServerTimingMetric = {
  name: string;
  durationMs: number;
  description?: string;
};

/** Default threshold for slow proxy log lines (override via ARCHLUCID_UI_PROXY_SLOW_MS). */
export const DEFAULT_PROXY_SLOW_MS = 1000;

export function resolveProxySlowThresholdMs(
  envValue: string | undefined = process.env.ARCHLUCID_UI_PROXY_SLOW_MS,
): number {
  if (envValue === undefined || envValue.trim().length === 0) {
    return DEFAULT_PROXY_SLOW_MS;
  }

  const parsed = Number(envValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_PROXY_SLOW_MS;
  }

  return parsed;
}

export function elapsedMsSince(startedAtMs: number, nowMs: number = performance.now()): number {
  const elapsed = nowMs - startedAtMs;

  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return 0;
  }

  return Math.round(elapsed * 100) / 100;
}

/** Formats metrics as a Server-Timing header value (RFC 9651 subset). */
export function createServerTimingHeader(metrics: readonly ServerTimingMetric[]): string {
  return metrics
    .filter((m) => m.name.trim().length > 0 && Number.isFinite(m.durationMs))
    .map((m) => {
      const dur = Math.max(0, Math.round(m.durationMs * 100) / 100);
      const base = `${m.name};dur=${dur}`;

      if (m.description && m.description.trim().length > 0) {
        // Descriptions must not contain unescaped quotes.
        const desc = m.description.replace(/"/g, "").slice(0, 64);

        return `${base};desc="${desc}"`;
      }

      return base;
    })
    .join(", ");
}

export function applyServerTimingHeader(
  headers: Headers,
  metrics: readonly ServerTimingMetric[],
): void {
  const value = createServerTimingHeader(metrics);

  if (value.length === 0) {
    return;
  }

  const existing = headers.get("Server-Timing");

  if (existing && existing.trim().length > 0) {
    headers.set("Server-Timing", `${existing}, ${value}`);

    return;
  }

  headers.set("Server-Timing", value);
}

export function shouldLogSlowOrFailedRequest(
  totalMs: number,
  status: number,
  slowThresholdMs: number = resolveProxySlowThresholdMs(),
): boolean {
  if (status >= 400) {
    return true;
  }

  return totalMs >= slowThresholdMs;
}

/** One-line JSON for operators scraping UI server logs (no response bodies). */
export function logServerRequestTiming(
  event: string,
  fields: Record<string, string | number | undefined>,
): void {
  const cleaned: Record<string, string | number> = {};

  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      cleaned[k] = v;
    }
  }

  console.warn(JSON.stringify({ component: "archlucid-ui-server-timing", event, ...cleaned }));
}
