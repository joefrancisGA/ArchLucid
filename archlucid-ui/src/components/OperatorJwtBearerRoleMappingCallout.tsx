import Link from "next/link";

import { HelpLink } from "@/components/HelpLink";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";

type OperatorJwtBearerRoleMappingCalloutProps = {
  testId?: string;
};

/**
 * Troubleshooting banner for generic OIDC (`JwtBearer`) deployments where the token lacks `ArchLucidRoles` claims.
 */
export function OperatorJwtBearerRoleMappingCallout(props: OperatorJwtBearerRoleMappingCalloutProps) {
  const configurationReferenceUrl = toDocsBlobUrl("/docs/library/CONFIGURATION_REFERENCE.md");

  return (
    <div
      className="rounded-md border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
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
          href={configurationReferenceUrl}
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open CONFIGURATION_REFERENCE.md (ArchLucidAuth role mapping)
        </Link>
        {" · "}
        <HelpLink
          docPath="/docs/library/contributor-reference/SECURITY.md"
          label="Open SECURITY.md ArchLucidRoles reference (new tab)"
          className="inline-flex h-4 w-4 align-middle"
        />
      </p>
    </div>
  );
}
