import { classifyWorkingRouteRole } from "@/lib/working-route-roles";

/** Operator App Router paths where long-form livelihood editing should keep OIDC access tokens fresh (LP-12). */
export function isOperatorOidcKeepaliveRoute(pathname: string): boolean {
  const role = classifyWorkingRouteRole(pathname);

  return role !== "marketing" && role !== "auth-onboarding";
}
