"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Button } from "@/components/ui/button";
import {
  buildAwsCloudConnectionTrustPolicyTemplate,
  CONNECT_AWS_SECURELY_FEDERATION_IDENTIFIERS,
  CONNECT_AWS_SECURELY_FEDERATION_HEADING,
  CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR,
  CONNECT_AWS_SECURELY_TRUST_POLICY_HEADING,
  CONNECT_AWS_SECURELY_TRUST_POLICY_INTRO,
  CONNECT_AWS_SECURELY_TRUST_POLICY_REPLACE_HINT,
} from "@/lib/connect-aws-securely-help-content";
import {
  AWS_TRUST_STARTER_FEDERATION_INTRO_LEAD,
  AWS_TRUST_STARTER_FEDERATION_INTRO_MID,
  AWS_TRUST_STARTER_FEDERATION_INTRO_TAIL,
} from "@/lib/aws-cloud-connection-trust-policy-starter";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { ASSURANCE_STATUS_PUBLIC_PATH } from "@/lib/marketing-assurance-public-labels";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ASSURANCE_STATUS_PATH = ASSURANCE_STATUS_PUBLIC_PATH;

/** Federation identifiers table and copyable IAM trust-policy template for AWS setup. */
export function HelpConnectAwsSecurelyTrustPolicyPanel(): React.ReactElement {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const trustPolicyTemplate = useMemo(() => buildAwsCloudConnectionTrustPolicyTemplate(), []);

  const copyTrustPolicy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trustPolicyTemplate);
      setCopyStatus("success");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      showError("AWS trust policy", CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR);
      window.setTimeout(() => setCopyStatus("idle"), 4000);
    }
  }, [trustPolicyTemplate]);

  const copyStatusMessage =
    copyStatus === "success"
      ? "Trust policy copied to clipboard."
      : copyStatus === "error"
        ? CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR
        : "";

  return (
    <div className="space-y-4" id="connect-aws-securely-federation-panel" data-testid="connect-aws-securely-federation-panel">
      <div className="space-y-3">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CONNECT_AWS_SECURELY_FEDERATION_HEADING}</h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {AWS_TRUST_STARTER_FEDERATION_INTRO_LEAD}{" "}
          <Link href={ASSURANCE_STATUS_PATH} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Assurance status
          </Link>{" "}
          {AWS_TRUST_STARTER_FEDERATION_INTRO_MID}{" "}
          <Link href={CONNECTION_STATUS_CANONICAL_PATH} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Connection status
          </Link>{" "}
          {AWS_TRUST_STARTER_FEDERATION_INTRO_TAIL}
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
                    <span className="inline-flex items-center gap-1">
                      <span>{identifier.label}</span>
                      <FieldHelpTooltip label={identifier.label} hint={identifier.hint} />
                    </span>
                  </th>
                  <td className={cn(HELP_PAGE_LAYOUT.tableBodyCell, "font-mono text-sm")}>
                    {identifier.value}
                    {identifier.isPlaceholder ? <span className="sr-only"> (placeholder)</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <details className="group space-y-3" open data-testid="connect-aws-securely-trust-policy-disclosure">
        <summary className={cn("cursor-pointer list-none font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          <span className="inline-flex flex-wrap items-center justify-between gap-2">
            <span>{CONNECT_AWS_SECURELY_TRUST_POLICY_HEADING}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="connect-aws-securely-trust-policy-copy"
              aria-label="Copy IAM trust policy template"
              onClick={(event) => {
                event.preventDefault();
                void copyTrustPolicy();
              }}
            >
              {copyStatus === "success" ? "Copied" : "Copy trust policy"}
            </Button>
          </span>
        </summary>
        <p
          className="sr-only"
          aria-live="polite"
          data-testid="connect-aws-securely-trust-policy-copy-status"
        >
          {copyStatusMessage}
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
      </details>
    </div>
  );
}
