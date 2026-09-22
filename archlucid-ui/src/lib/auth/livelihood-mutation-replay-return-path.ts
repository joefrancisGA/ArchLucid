import { isOperatorOidcKeepaliveRoute } from "@/lib/auth/operator-oidc-keepalive-route";
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

/** Operator livelihood pages only — blocks marketing and auth bootstrap routes (LW-064). */
export function isLivelihoodMutationReplayReturnPath(candidate: string | null | undefined): boolean {
  if (!isSafeReturnPath(candidate)) {
    return false;
  }

  const pathOnly = candidate.split("?")[0]?.split("#")[0] ?? candidate;

  if (pathOnly === "/auth" || pathOnly.startsWith("/auth/")) {
    return false;
  }

  return isOperatorOidcKeepaliveRoute(pathOnly);
}
