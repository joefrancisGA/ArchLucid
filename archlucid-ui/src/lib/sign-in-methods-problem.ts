import { tryParseApiProblemDetails, type ApiProblemDetails } from "@/lib/api-problem";
import { accountSecurityAuthGateMessage } from "@/lib/account-security-page-copy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

/** Discriminated failure from sign-in-methods API calls — never carries raw JSON for UI. */
export type SignInMethodsProblemKind =
  | "unauthorized-platform-user"
  | "demo-session-blocked"
  | "recent-auth-required"
  | "validation"
  | "not-found"
  | "network"
  | "unknown";

export type SignInMethodsProblem = {
  readonly kind: SignInMethodsProblemKind;
  /** Short human message suitable for a callout — never ProblemDetails JSON. */
  readonly message: string;
};

const PLATFORM_USER_REQUIRED = "Authenticated platform user is required.";
const RECENT_AUTH_REQUIRED_SNIPPET = "Recent authentication is required";

export class SignInMethodsApiError extends Error {
  readonly problem: SignInMethodsProblem;

  constructor(problem: SignInMethodsProblem) {
    super(problem.message);
    this.name = "SignInMethodsApiError";
    this.problem = problem;
  }
}

export function isSignInMethodsApiError(error: unknown): error is SignInMethodsApiError {
  return error instanceof SignInMethodsApiError;
}

function humanMessageFromProblem(problem: ApiProblemDetails | null, status: number): string {
  const detail = problem?.detail?.trim();

  if (detail !== undefined && detail.length > 0 && !detail.startsWith("{")) {
    return detail;
  }

  const title = problem?.title?.trim();

  if (title !== undefined && title.length > 0 && title.toLowerCase() !== "unauthorized") {
    return title;
  }

  if (status === 401) {
    return "Sign in is required to manage sign-in methods.";
  }

  if (status === 404) {
    return "That sign-in method or link proposal was not found.";
  }

  if (status >= 500) {
    return "Sign-in methods are temporarily unavailable. Try again.";
  }

  return "Could not complete the sign-in methods request.";
}

function classifyProblem(problem: ApiProblemDetails | null, status: number, plainText: string): SignInMethodsProblem {
  const detail = problem?.detail?.trim() ?? "";
  const errorCode = problem?.errorCode?.trim().toUpperCase() ?? "";
  const plain = plainText.trim();
  const combined = `${detail} ${plain}`;

  if (
    status === 401 ||
    errorCode === "UNAUTHORIZED" ||
    detail === PLATFORM_USER_REQUIRED ||
    plain.includes(PLATFORM_USER_REQUIRED)
  ) {
    return {
      kind: "unauthorized-platform-user",
      message:
        detail === PLATFORM_USER_REQUIRED || detail.length > 0
          ? accountSecurityAuthGateMessage(resolveProductLineIdFromEnv())
          : humanMessageFromProblem(problem, status),
    };
  }

  if (status === 400 && combined.includes(RECENT_AUTH_REQUIRED_SNIPPET)) {
    return {
      kind: "recent-auth-required",
      message: "Recent authentication is required. Sign in again and retry.",
    };
  }

  if (status === 404) {
    return {
      kind: "not-found",
      message: humanMessageFromProblem(problem, status),
    };
  }

  if (status === 400 || status === 422) {
    return {
      kind: "validation",
      message: humanMessageFromProblem(problem, status),
    };
  }

  return {
    kind: "unknown",
    message: humanMessageFromProblem(problem, status),
  };
}

/**
 * Maps an HTTP failure body to a UI-safe problem. Never returns raw JSON as `message`.
 */
export function classifySignInMethodsHttpFailure(
  status: number,
  bodyText: string,
  contentType: string | null,
): SignInMethodsProblem {
  const problem = tryParseApiProblemDetails(bodyText, contentType);
  const classified = classifyProblem(problem, status, bodyText);

  if (classified.message.includes("{") && classified.message.includes("}")) {
    return {
      kind: classified.kind,
      message: "Could not complete the sign-in methods request.",
    };
  }

  return classified;
}

export function classifySignInMethodsUnknownFailure(error: unknown): SignInMethodsProblem {
  if (isSignInMethodsApiError(error)) {
    return error.problem;
  }

  if (error instanceof TypeError) {
    return {
      kind: "network",
      message: "Could not reach the server. Check your connection and try again.",
    };
  }

  return {
    kind: "unknown",
    message: "Could not complete the sign-in methods request.",
  };
}

/** Basic email shape for TB-2005 disable-until-ready (client-known). */
export function isPlausibleEmailAddress(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length < 3 || trimmed.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** Six digit OTP for TB-2005 disable-until-ready. */
export function isSixDigitVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function digitsOnlyMaxLength(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function msUntilExpiry(expiresUtc: string | null | undefined, nowMs: number = Date.now()): number | null {
  if (expiresUtc === null || expiresUtc === undefined) {
    return null;
  }

  const ms = Date.parse(expiresUtc.trim());

  if (!Number.isFinite(ms)) {
    return null;
  }

  return ms - nowMs;
}

export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
