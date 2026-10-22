/**
 * Troubleshooting banner for generic OIDC (`JwtBearer`) deployments where the token lacks workspace roles.
 */
"use client";

import Link from "next/link";

import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorJwtBearerRoleMappingCalloutProps = {
  testId?: string;
};

export function OperatorJwtBearerRoleMappingCallout(props: OperatorJwtBearerRoleMappingCalloutProps) {
  const { localize } = useLocalizedProductCopy();

  return (
    <div
      className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.body)}
      role="alert"
      data-testid={props.testId ?? "operator-jwt-role-mapping-callout"}
    >
      <p className="m-0 font-medium">
        {localize("Signed in, but no ArchLucid workspace role was found")}
      </p>
      <p className="mb-0 mt-2 text-pretty">
        {localize(
          "Your identity token is valid, but it does not map to a workspace role (Admin, Operator, Reader, or Auditor). Ask a workspace administrator to map your identity-provider groups to ArchLucid roles, then sign in again.",
        )}
      </p>
      <p className="mb-0 mt-2">
        <Link
          href="/administration/identity-providers/role-mapping"
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
        >
          Open role mapping
        </Link>
      </p>
    </div>
  );
}
