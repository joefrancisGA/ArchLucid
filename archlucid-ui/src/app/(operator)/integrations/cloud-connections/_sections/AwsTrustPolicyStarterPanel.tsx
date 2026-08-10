"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AWS_TRUST_STARTER_FEDERATION_HEADING,
  AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS,
  AWS_TRUST_STARTER_FEDERATION_INTRO,
  AWS_TRUST_STARTER_TRUST_POLICY_HEADING,
  AWS_TRUST_STARTER_TRUST_POLICY_INTRO,
  AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT,
  buildAwsTrustStarterPolicyTemplate,
} from "@/lib/aws-cloud-connection-trust-policy-starter";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { cn } from "@/lib/utils";

/** Federation identifiers and copyable IAM trust-policy starter for AWS identity setup (TB-1765). */
export function AwsTrustPolicyStarterPanel(): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const trustPolicyTemplate = useMemo(() => buildAwsTrustStarterPolicyTemplate(), []);

  const copyTrustPolicy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trustPolicyTemplate);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [trustPolicyTemplate]);

  return (
    <div className="space-y-4" data-testid="aws-trust-starter-panel">
      <div className="space-y-3">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AWS_TRUST_STARTER_FEDERATION_HEADING}</h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {AWS_TRUST_STARTER_FEDERATION_INTRO}
        </p>
        <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="aws-trust-starter-federation-identifiers">
          <table className={HELP_PAGE_LAYOUT.table}>
            <caption className="sr-only">OIDC federation identifiers for AWS IAM role trust</caption>
            <thead>
              <tr>
                <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                  Field
                </th>
                <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {AWS_TRUST_STARTER_FEDERATION_IDENTIFIERS.map((identifier, index) => (
                <tr
                  key={identifier.id}
                  className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                >
                  <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                    {identifier.label}
                  </th>
                  <td className={cn(HELP_PAGE_LAYOUT.tableBodyCell, "font-mono text-sm")}>
                    {identifier.value}
                    {identifier.isPlaceholder ? (
                      <span className="sr-only"> (placeholder — obtain live value from security review)</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AWS_TRUST_STARTER_TRUST_POLICY_HEADING}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="aws-trust-starter-trust-policy-copy"
            aria-label="Copy IAM trust policy template"
            onClick={() => void copyTrustPolicy()}
          >
            {copied ? "Copied" : "Copy trust policy"}
          </Button>
        </div>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {AWS_TRUST_STARTER_TRUST_POLICY_INTRO}
        </p>
        <pre
          className={cn(
            "max-h-[min(40vh,360px)] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.micro,
            "leading-relaxed",
          )}
          data-testid="aws-trust-starter-trust-policy-template"
        >
          <code>{trustPolicyTemplate}</code>
        </pre>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AWS_TRUST_STARTER_TRUST_POLICY_REPLACE_HINT}
        </p>
      </div>
    </div>
  );
}
