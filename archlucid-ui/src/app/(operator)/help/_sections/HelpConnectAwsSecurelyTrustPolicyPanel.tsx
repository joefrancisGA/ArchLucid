"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildAwsCloudConnectionTrustPolicyTemplate,
  CONNECT_AWS_SECURELY_FEDERATION_IDENTIFIERS,
  CONNECT_AWS_SECURELY_FEDERATION_HEADING,
  CONNECT_AWS_SECURELY_FEDERATION_INTRO,
  CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR,
  CONNECT_AWS_SECURELY_TRUST_POLICY_HEADING,
  CONNECT_AWS_SECURELY_TRUST_POLICY_INTRO,
  CONNECT_AWS_SECURELY_TRUST_POLICY_REPLACE_HINT,
} from "@/lib/connect-aws-securely-help-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Federation identifiers table and copyable IAM trust-policy template for AWS setup. */
export function HelpConnectAwsSecurelyTrustPolicyPanel(): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const trustPolicyTemplate = useMemo(() => buildAwsCloudConnectionTrustPolicyTemplate(), []);

  const copyTrustPolicy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trustPolicyTemplate);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      showError("AWS trust policy", CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR);
    }
  }, [trustPolicyTemplate]);

  return (
    <div className="space-y-4" id="connect-aws-securely-federation-panel" data-testid="connect-aws-securely-federation-panel">
      <div className="space-y-3">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CONNECT_AWS_SECURELY_FEDERATION_HEADING}</h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CONNECT_AWS_SECURELY_FEDERATION_INTRO}
        </p>
        <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="connect-aws-securely-federation-identifiers">
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
              {CONNECT_AWS_SECURELY_FEDERATION_IDENTIFIERS.map((identifier, index) => (
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
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CONNECT_AWS_SECURELY_TRUST_POLICY_HEADING}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="connect-aws-securely-trust-policy-copy"
            aria-label="Copy IAM trust policy template"
            onClick={() => void copyTrustPolicy()}
          >
            {copied ? "Copied" : "Copy trust policy"}
          </Button>
        </div>
        <p
          className="sr-only"
          aria-live="polite"
          data-testid="connect-aws-securely-trust-policy-copy-status"
        >
          {copied ? "Trust policy copied to clipboard." : ""}
        </p>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CONNECT_AWS_SECURELY_TRUST_POLICY_INTRO}
        </p>
        <pre
          className={cn(
            "max-h-[min(40vh,360px)] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.micro,
            "leading-relaxed",
          )}
          data-testid="connect-aws-securely-trust-policy-template"
        >
          <code>{trustPolicyTemplate}</code>
        </pre>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CONNECT_AWS_SECURELY_TRUST_POLICY_REPLACE_HINT}
        </p>
      </div>
    </div>
  );
}
