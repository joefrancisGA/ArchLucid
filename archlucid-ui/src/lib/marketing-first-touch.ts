/** Cookie + header helpers for signup first-touch attribution (TB-019). */
export const MARKETING_FIRST_TOUCH_COOKIE = "archlucid.firstTouch.v1";

export type MarketingFirstTouchPayload = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  capturedUtc: string;
};

const MAX_LEN = 120;

function sanitize(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > MAX_LEN ? trimmed.slice(0, MAX_LEN) : trimmed;
}

export function buildFirstTouchFromSearchParams(params: URLSearchParams): MarketingFirstTouchPayload | null {
  const payload: MarketingFirstTouchPayload = {
    utm_source: sanitize(params.get("utm_source")),
    utm_medium: sanitize(params.get("utm_medium")),
    utm_campaign: sanitize(params.get("utm_campaign")),
    utm_content: sanitize(params.get("utm_content")),
    capturedUtc: new Date().toISOString(),
  };

  if (!payload.utm_source && !payload.utm_medium && !payload.utm_campaign && !payload.utm_content) {
    return null;
  }

  return payload;
}

export function serializeFirstTouchHeader(payload: MarketingFirstTouchPayload): string {
  return btoa(JSON.stringify(payload));
}

export function readFirstTouchCookie(): MarketingFirstTouchPayload | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${MARKETING_FIRST_TOUCH_COOKIE}=`));

  if (!match) return null;

  const raw = decodeURIComponent(match.slice(MARKETING_FIRST_TOUCH_COOKIE.length + 1));

  try {
    return JSON.parse(raw) as MarketingFirstTouchPayload;
  } catch {
    return null;
  }
}

export function writeFirstTouchCookie(payload: MarketingFirstTouchPayload): void {
  if (typeof document === "undefined") return;

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const maxAgeSec = 60 * 60 * 24 * 90;
  document.cookie = `${MARKETING_FIRST_TOUCH_COOKIE}=${encoded}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
}
