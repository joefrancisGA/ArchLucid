import { AUTH_BOOTSTRAP_CANONICAL_PATH } from "@/lib/auth-bootstrap-evidence-copy";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { bootstrapDedicatedWorkspaceScope } from "@/lib/operator/operator-scope-bootstrap";
import { isSampleWorkspaceVisitActive } from "@/lib/operator/operator-sample-workspace-visit";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { isSampleWorkspaceScope } from "@/lib/operator/operator-workspace-scope-model";
import { isLikelySignedIn } from "@/lib/oidc/session";

function isAuthBootstrapPath(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}

/** LS-010 — signed-in live seat must not stay on silent demo when dedicated scope cannot be resolved. */
export async function runSignedInDedicatedScopeBootstrap(): Promise<void> {
  if (!isLikelySignedIn() || isStaticDemoPayloadFallbackEnabled()) {
    return;
  }

  const applied = await bootstrapDedicatedWorkspaceScope();

  if (applied) {
    return;
  }

  const stored = readOperatorScopeFromStorage();

  if (stored === null || !isSampleWorkspaceScope(stored) || isSampleWorkspaceVisitActive()) {
    return;
  }

  const pathname = typeof window !== "undefined" ? window.location.pathname ?? "/" : "/";

  if (isAuthBootstrapPath(pathname)) {
    return;
  }

  window.location.replace(AUTH_BOOTSTRAP_CANONICAL_PATH);
}
