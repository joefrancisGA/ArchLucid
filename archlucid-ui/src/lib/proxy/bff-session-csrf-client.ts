import { BFF_CSRF_COOKIE_NAME, BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";

function readCookieValue(cookieName: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${cookieName}=`;
  const cookies = document.cookie.split(";");

  for (const rawCookie of cookies) {
    const trimmed = rawCookie.trim();

    if (trimmed.startsWith(prefix)) {
      const value = trimmed.slice(prefix.length).trim();

      return value.length > 0 ? value : null;
    }
  }

  return null;
}

/** Returns the readable CSRF companion cookie value for mutating same-origin proxy calls. */
export function readBffCsrfTokenFromDocument(): string | undefined {
  const value = readCookieValue(BFF_CSRF_COOKIE_NAME);

  return value ?? undefined;
}

export function applyBffCsrfHeader(headers: Headers): void {
  const csrfToken = readBffCsrfTokenFromDocument();

  if (csrfToken !== undefined && csrfToken.length > 0) {
    headers.set(BFF_CSRF_HEADER, csrfToken);
  }
}
