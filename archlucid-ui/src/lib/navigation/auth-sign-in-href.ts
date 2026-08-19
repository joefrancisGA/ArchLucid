import type { SessionMessageReason } from "@/app/(operator)/auth/signin/session-message-copy";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

export type AuthSignInHrefOptions = {
  readonly reason?: SessionMessageReason;
  readonly returnPath?: string;
};

function appendReturnUrl(params: URLSearchParams, returnPath: string | undefined): void {
  if (returnPath !== undefined && isSafeReturnPath(returnPath)) {
    params.set("returnUrl", returnPath);
  }
}

/** Builds `/auth/signin` with optional session-message reason and safe return path. */
export function buildAuthSignInHref(options?: AuthSignInHrefOptions): string {
  const params = new URLSearchParams();

  if (options?.reason !== undefined) {
    params.set("reason", options.reason);
  }

  appendReturnUrl(params, options?.returnPath);

  const query = params.toString();

  return query.length > 0 ? `/auth/signin?${query}` : "/auth/signin";
}

/** Preferred idle-timeout destination — explicit sign-in click, no auto-redirect loop. */
export function buildSessionExpiredHref(returnPath?: string): string {
  const params = new URLSearchParams();

  params.set("reason", "idle-timeout");
  appendReturnUrl(params, returnPath);

  return `/auth/session-expired?${params.toString()}`;
}
