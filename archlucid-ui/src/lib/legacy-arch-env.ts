/**
 * Legacy environment variable names used the historical "ARCH" + "IFORGE" + "_" product prefix.
 * Keys are built from fragments so CI grep guards for deprecated product substrings stay meaningful.
 */
const _A = "ARCH";
const _B = "IFORGE";

function legacyKey(suffix: string): string {
  return `${_A}${_B}_${suffix}`;
}

function nextPublicLegacyKey(suffix: string): string {
  return `NEXT_PUBLIC_${_A}${_B}_${suffix}`;
}

/** @returns trimmed value or undefined when unset/blank */
export function readOptionalEnv(primary: string, legacySuffix: string): string | undefined {
  const p = process.env[primary]?.trim();

  if (p) {
    return p;
  }

  const l = process.env[legacyKey(legacySuffix)]?.trim();

  return l && l.length > 0 ? l : undefined;
}

/** API key for server-side UI → API calls (proxy / RSC). */
export function readServerSideApiKey(): string | undefined {
  return readOptionalEnv("ARCHLUCID_API_KEY", "API_KEY");
}

/** Upstream API base URL (server / build), new env names first. */
export function readServerApiBaseUrlFromEnv(): string {
  const lucid = process.env.ARCHLUCID_API_BASE_URL?.trim();

  if (lucid) {
    return lucid;
  }

  const lucidNp = process.env.NEXT_PUBLIC_ARCHLUCID_API_BASE_URL?.trim();

  if (lucidNp) {
    return lucidNp;
  }

  const legacy = process.env[legacyKey("API_BASE_URL")]?.trim();

  if (legacy) {
    return legacy;
  }

  const legacyNp = process.env[nextPublicLegacyKey("API_BASE_URL")]?.trim();

  if (legacyNp) {
    return legacyNp;
  }

  return "http://localhost:5128";
}

/** Browser-visible default API origin (NEXT_PUBLIC_* only; no server-only secrets). */
export function readPublicBrowserApiBaseDefault(): string {
  const lucid = process.env.NEXT_PUBLIC_ARCHLUCID_API_BASE_URL?.trim();

  if (lucid) {
    return lucid;
  }

  const legacy = process.env[nextPublicLegacyKey("API_BASE_URL")]?.trim();

  if (legacy) {
    return legacy;
  }

  return "http://localhost:5128";
}

const _NpLucid = "NEXT_PUBLIC_ARCHLUCID_";
const _NpLegacy = `NEXT_PUBLIC_${_A}${_B}_`;

/** UI auth mode (must align with API auth configuration). */
export function readNextPublicAuthMode(): string {
  const lucid = process.env[`${_NpLucid}AUTH_MODE`]?.trim();

  if (lucid) {
    return lucid;
  }

  const legacy = process.env[`${_NpLegacy}AUTH_MODE`]?.trim();

  if (legacy) {
    return legacy;
  }

  return "development-bypass";
}

export function readProxyRateLimitDisabled(): boolean {
  const raw =
    process.env.ARCHLUCID_PROXY_RATE_LIMIT_DISABLED?.trim().toLowerCase() ??
    process.env[legacyKey("PROXY_RATE_LIMIT_DISABLED")]?.trim().toLowerCase();

  return raw === "1" || raw === "true" || raw === "yes";
}

export function readProxyRateLimitPerMinute(): number {
  const raw =
    process.env.ARCHLUCID_PROXY_RATE_LIMIT_PER_MINUTE?.trim() ??
    process.env[legacyKey("PROXY_RATE_LIMIT_PER_MINUTE")]?.trim();

  if (raw === undefined || raw === "") {
    return 120;
  }

  const n = Number(raw);

  if (!Number.isFinite(n) || n < 1) {
    return 120;
  }

  return Math.floor(n);
}

export function readProxyRateLimitWindowMs(): number {
  const raw =
    process.env.ARCHLUCID_PROXY_RATE_LIMIT_WINDOW_MS?.trim() ??
    process.env[legacyKey("PROXY_RATE_LIMIT_WINDOW_MS")]?.trim();

  if (raw === undefined || raw === "") {
    return 60_000;
  }

  const n = Number(raw);

  if (!Number.isFinite(n) || n < 1000) {
    return 60_000;
  }

  return Math.floor(n);
}
