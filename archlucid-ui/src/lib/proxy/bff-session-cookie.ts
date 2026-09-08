import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

import { isBffSessionIdleExpired } from "@/lib/proxy/bff-session-idle";

/** HttpOnly BFF session cookie (ADR 0059; LK-06 tokens; LK-07 idle + CSRF). */
export const BFF_SESSION_COOKIE_NAME = "archlucid-bff-session" as const;

const BFF_SESSION_COOKIE_VERSION = 2;

export type BffSessionPayload = {
  readonly v: number;
  readonly at: string;
  readonly exp: number;
  readonly la: number;
  readonly csrf: string;
  readonly wm?: 0 | 1;
  readonly rt?: string;
  readonly it?: string;
};

export type BffSessionCookieIssueInput = {
  readonly accessToken: string;
  readonly expiresAtMs: number;
  readonly lastActivityAtMs?: number;
  readonly csrfToken?: string | null;
  readonly workingMode?: boolean;
  readonly refreshToken?: string | null;
  readonly idToken?: string | null;
};

export type BffSessionCookieIssueResult = {
  readonly sessionCookieValue: string;
  readonly csrfToken: string;
};

function readBffSessionSigningSecret(): string {
  const fromArchlucid = process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET?.trim() ?? "";
  const fromLegacy = process.env.BFF_SESSION_SIGNING_SECRET?.trim() ?? "";

  return fromArchlucid.length > 0 ? fromArchlucid : fromLegacy;
}

function encodePayload(payload: BffSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function normalizeLegacyPayload(parsed: BffSessionPayload): BffSessionPayload | null {
  if (parsed.v === BFF_SESSION_COOKIE_VERSION) {
    if (typeof parsed.la !== "number" || !Number.isFinite(parsed.la)) {
      return null;
    }

    if (typeof parsed.csrf !== "string" || parsed.csrf.trim().length === 0) {
      return null;
    }

    return parsed;
  }

  if (parsed.v === 1) {
    const migrated: BffSessionPayload = {
      v: BFF_SESSION_COOKIE_VERSION,
      at: parsed.at,
      exp: parsed.exp,
      la: Date.now(),
      csrf: generateBffSessionCsrfToken(),
      wm: 1,
      ...(parsed.rt !== undefined ? { rt: parsed.rt } : {}),
      ...(parsed.it !== undefined ? { it: parsed.it } : {}),
    };

    return migrated;
  }

  return null;
}

function parseSignedCookieValue(cookieValue: string, secret: string): BffSessionPayload | null {
  const parts = cookieValue.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;

  if (encodedPayload === undefined || signature === undefined) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as BffSessionPayload;

    if (typeof parsed.at !== "string" || parsed.at.trim().length === 0) {
      return null;
    }

    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }

    if (parsed.rt !== undefined && (typeof parsed.rt !== "string" || parsed.rt.trim().length === 0)) {
      return null;
    }

    if (parsed.it !== undefined && (typeof parsed.it !== "string" || parsed.it.trim().length === 0)) {
      return null;
    }

    return normalizeLegacyPayload(parsed);
  } catch {
    return null;
  }
}

export function generateBffSessionCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Returns false when signing secret is not configured (dual-mode falls back to Bearer / API key). */
export function isBffSessionCookieEnabled(): boolean {
  return readBffSessionSigningSecret().length > 0;
}

export function createBffSessionCookieValue(input: BffSessionCookieIssueInput): BffSessionCookieIssueResult | null {
  const secret = readBffSessionSigningSecret();

  if (secret.length === 0) {
    return null;
  }

  const accessToken = input.accessToken.trim();

  if (accessToken.length === 0) {
    return null;
  }

  const refreshToken = input.refreshToken?.trim() ?? "";
  const idToken = input.idToken?.trim() ?? "";
  const csrfToken = input.csrfToken?.trim() || generateBffSessionCsrfToken();
  const lastActivityAtMs = input.lastActivityAtMs ?? Date.now();
  const payload: BffSessionPayload = {
    v: BFF_SESSION_COOKIE_VERSION,
    at: accessToken,
    exp: input.expiresAtMs,
    la: lastActivityAtMs,
    csrf: csrfToken,
    wm: input.workingMode === true ? 1 : 0,
    ...(refreshToken.length > 0 ? { rt: refreshToken } : {}),
    ...(idToken.length > 0 ? { it: idToken } : {}),
  };

  const encodedPayload = encodePayload(payload);

  return {
    sessionCookieValue: `${encodedPayload}.${signPayload(encodedPayload, secret)}`,
    csrfToken,
  };
}

export function slideBffSessionActivity(
  payload: BffSessionPayload,
  options?: { readonly workingMode?: boolean; readonly nowMs?: number },
): BffSessionCookieIssueResult | null {
  const nowMs = options?.nowMs ?? Date.now();
  const workingMode = options?.workingMode ?? payload.wm === 1;

  return createBffSessionCookieValue({
    accessToken: payload.at,
    expiresAtMs: payload.exp,
    lastActivityAtMs: nowMs,
    csrfToken: payload.csrf,
    workingMode,
    refreshToken: payload.rt ?? null,
    idToken: payload.it ?? null,
  });
}

export function parseBffSessionCookieValue(cookieValue: string): BffSessionPayload | null {
  const secret = readBffSessionSigningSecret();

  if (secret.length === 0) {
    return null;
  }

  return parseSignedCookieValue(cookieValue.trim(), secret);
}

export function parseBffSessionPayloadFromRequest(request: NextRequest): BffSessionPayload | null {
  const cookieValue = request.cookies.get(BFF_SESSION_COOKIE_NAME)?.value ?? null;

  if (cookieValue === null || cookieValue.trim().length === 0) {
    return null;
  }

  const payload = parseBffSessionCookieValue(cookieValue);

  if (payload === null) {
    return null;
  }

  if (Date.now() >= payload.exp) {
    return null;
  }

  if (isBffSessionIdleExpired(payload)) {
    return null;
  }

  return payload;
}

export function resolveBffSessionBearerFromCookieValue(cookieValue: string | null | undefined): string {
  const trimmed = cookieValue?.trim() ?? "";

  if (trimmed.length === 0) {
    return "";
  }

  const payload = parseBffSessionCookieValue(trimmed);

  if (payload === null) {
    return "";
  }

  if (Date.now() >= payload.exp) {
    return "";
  }

  if (isBffSessionIdleExpired(payload)) {
    return "";
  }

  return `Bearer ${payload.at}`;
}

export function resolveBffSessionBearerFromRequest(request: NextRequest): string {
  const cookieValue = request.cookies.get(BFF_SESSION_COOKIE_NAME)?.value ?? null;

  return resolveBffSessionBearerFromCookieValue(cookieValue);
}

export function buildBffSessionSetCookieHeader(cookieValue: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = Math.max(0, Math.trunc(maxAgeSeconds));

  return `${BFF_SESSION_COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}

export function buildBffCsrfSetCookieHeader(csrfToken: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = Math.max(0, Math.trunc(maxAgeSeconds));

  return `archlucid-bff-csrf=${csrfToken}; Path=/; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}

export function buildBffSessionClearCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${BFF_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}

export function buildBffCsrfClearCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `archlucid-bff-csrf=; Path=/; SameSite=Lax${secure}; Max-Age=0`;
}

export function buildBffSessionCookieHeaders(
  issueResult: BffSessionCookieIssueResult,
  expiresAtMs: number,
): string[] {
  const maxAgeSeconds = Math.max(0, Math.trunc((expiresAtMs - Date.now()) / 1000));

  return [
    buildBffSessionSetCookieHeader(issueResult.sessionCookieValue, maxAgeSeconds),
    buildBffCsrfSetCookieHeader(issueResult.csrfToken, maxAgeSeconds),
  ];
}

export function buildBffSessionClearCookieHeaders(): string[] {
  return [buildBffSessionClearCookieHeader(), buildBffCsrfClearCookieHeader()];
}
