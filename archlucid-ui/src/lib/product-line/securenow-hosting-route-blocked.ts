import { navHrefPathPart } from "@/lib/nav-href-path-part";
import { isSecureNowInTenantFromEnv } from "@/lib/product-line/resolve-securenow-hosting-mode";

const IN_TENANT_HOSTED_ONLY_PATHS = new Set(["/administration/billing"]);

export function isSecureNowInTenantHostedOnlyPath(pathname: string): boolean {
  return isSecureNowInTenantFromEnv() && IN_TENANT_HOSTED_ONLY_PATHS.has(navHrefPathPart(pathname));
}
