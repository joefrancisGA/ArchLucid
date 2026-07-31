import { redirect } from "next/navigation";

import { buildLoginRedirectPath } from "@/lib/legacy-login-redirect";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readReason(params: Record<string, string | string[] | undefined>): string | undefined {
  const value = params.reason;

  return typeof value === "string" ? value : undefined;
}

function readReturnUrl(params: Record<string, string | string[] | undefined>): string | undefined {
  const value = params.returnUrl;

  return typeof value === "string" ? value : undefined;
}

/**
 * Backward-compat shim: any hit to /login is forwarded to /auth/signin with query params preserved.
 * Idle-timeout bookmarks are routed to `/auth/session-expired` for the cleaner explicit sign-in flow.
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reason = readReason(params);
  const returnUrl = readReturnUrl(params);

  if (reason === "idle-timeout") {
    redirect(buildSessionExpiredHref(returnUrl));
  }

  redirect(buildLoginRedirectPath(params));
}
