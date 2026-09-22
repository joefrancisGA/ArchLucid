import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { persistIdleDeskRestoreBeforeSessionClear } from "@/lib/auth/idle-desk-restore";
import { SESSION_CLEARED_AT_STORAGE_KEY } from "@/lib/auth/session-idle-timeout";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";
import { clearOperatorScopeStorage } from "@/lib/operator/operator-scope-storage";
import { clearOidcSession } from "@/lib/oidc/session";

export type ClearOperatorSessionForExpiryOptions = {
  readonly returnPath?: string;
  readonly broadcastAuthCleared?: boolean;
};

/** Clears operator auth + scope and routes to session-expired (idle timeout or sibling auth-cleared). */
export function clearOperatorSessionForExpiry(
  router: AppRouterInstance,
  options?: ClearOperatorSessionForExpiryOptions,
): void {
  const returnPath = options?.returnPath ?? `${window.location.pathname}${window.location.search}`;

  sessionStorage.setItem(SESSION_CLEARED_AT_STORAGE_KEY, new Date().toISOString());
  persistIdleDeskRestoreBeforeSessionClear(returnPath);
  clearOidcSession({ broadcastAuthCleared: options?.broadcastAuthCleared });

  clearOperatorScopeStorage();
  router.push(buildSessionExpiredHref(returnPath));
  router.refresh();
}
