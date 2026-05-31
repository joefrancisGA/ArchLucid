import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

type OperatorJwtBearerRoleMappingCalloutProps = {
  testId?: string;
};

/**
 * Troubleshooting banner for generic OIDC (`JwtBearer`) deployments where the token lacks `ArchLucidRoles` claims.
 */
export function OperatorJwtBearerRoleMappingCallout(props: OperatorJwtBearerRoleMappingCalloutProps) {
  const configurationReferenceHref = inAppHelpHref("configuration-reference");

  return (
    <div
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50"
      role="alert"
      data-testid={props.testId ?? "operator-jwt-role-mapping-callout"}
    >
      <p className="m-0 font-medium">JWT signed in, but no ArchLucid app role was found</p>
      <p className="mb-0 mt-2 text-pretty">
        Map your IdP groups or custom claims to <code className="text-xs">ArchLucidRoles</code> (Admin, Operator,
        Reader, or Auditor) via <code className="text-xs">ArchLucidAuth:RoleClaimSources</code>, then sign in again.
      </p>
      <p className="mb-0 mt-2">
        <Link
          href={configurationReferenceHref}
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
        >
          Open configuration reference (ArchLucidAuth role mapping)
        </Link>
        {" · "}
        <InAppHelpLink
          helpSlug="operator-auth-roles"
          label="Open SECURITY.md ArchLucidRoles reference"
          className="inline-flex h-4 w-4 align-middle"
        />
      </p>
    </div>
  );
}
