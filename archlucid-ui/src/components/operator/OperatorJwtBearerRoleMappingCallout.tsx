import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorJwtBearerRoleMappingCalloutProps = {
  testId?: string;
};

/**
 * Troubleshooting banner for generic OIDC (`JwtBearer`) deployments where the token lacks workspace roles.
 */
export function OperatorJwtBearerRoleMappingCallout(props: OperatorJwtBearerRoleMappingCalloutProps) {
  return (
    <div
      className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.body)}
      role="alert"
      data-testid={props.testId ?? "operator-jwt-role-mapping-callout"}
    >
      <p className="m-0 font-medium">Signed in, but no ArchLucid workspace role was found</p>
      <p className="mb-0 mt-2 text-pretty">
        Your identity token is valid, but it does not map to a workspace role (Admin, Operator, Reader, or Auditor). Ask
        a workspace administrator to map your identity-provider groups to ArchLucid roles, then sign in again.
      </p>
      <p className="mb-0 mt-2">
        <Link
          href="/administration/identity-providers/role-mapping"
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
        >
          Open role mapping
        </Link>
      </p>
    </div>
  );
}
