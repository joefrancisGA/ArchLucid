"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import {
  AWS_TRUST_STARTER_FEDERATION_HEADING,
  AWS_TRUST_STARTER_FEDERATION_INTRO_MID,
  AWS_TRUST_STARTER_FEDERATION_INTRO_TAIL,
  AWS_TRUST_STARTER_TRUST_POLICY_HEADING,
  AWS_TRUST_STARTER_TRUST_POLICY_INTRO,
  awsTrustStarterFederationIdentifiers,
  awsTrustStarterFederationIntroLead,
  awsTrustStarterTrustPolicyReplaceHint,
  buildAwsTrustStarterPolicyTemplate,
} from "@/lib/aws-cloud-connection-trust-policy-starter";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

/** Federation identifiers and copyable IAM trust-policy starter for AWS identity setup (TB-1765). */
export function AwsTrustPolicyStarterPanel(): React.ReactElement {
  const { productLine } = useLocalizedProductCopy();
  const federationIdentifiers = useMemo(
    () => awsTrustStarterFederationIdentifiers(productLine),
    [productLine],
  );
  const federationIntroLead = useMemo(
    () => awsTrustStarterFederationIntroLead(productLine),
    [productLine],
  );
  const trustPolicyReplaceHint = useMemo(
    () => awsTrustStarterTrustPolicyReplaceHint(productLine),
    [productLine],
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const trustPolicyTemplate = useMemo(() => buildAwsTrustStarterPolicyTemplate(), []);
  const awsHelpHref = inAppHelpHref("cloud-connections-aws");

  const copyTrustPolicy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trustPolicyTemplate);
      setCopyFeedback("Template copied — replace placeholders before applying in AWS.");
      window.setTimeout(() => setCopyFeedback(null), 4000);
    } catch {
      setCopyFeedback(null);
    }
  }, [trustPolicyTemplate]);

  return (
    <div className="space-y-4" data-testid="aws-trust-starter-panel">
      <div className="space-y-3">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AWS_TRUST_STARTER_FEDERATION_HEADING}</h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {federationIntroLead}{" "}
          <Link href={CONNECTION_STATUS_CANONICAL_PATH} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Connection status
          </Link>{" "}
          {AWS_TRUST_STARTER_FEDERATION_INTRO_MID}{" "}
          <Link href={awsHelpHref} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Connect AWS securely
          </Link>{" "}
          {AWS_TRUST_STARTER_FEDERATION_INTRO_TAIL}
        </p>
        <div data-testid="aws-trust-starter-federation-identifiers">
          <EnterpriseTable ariaLabel="OIDC federation identifiers for AWS IAM role trust" className="w-full table-fixed">
            <caption className="sr-only">OIDC federation identifiers for AWS IAM role trust</caption>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell scope="col" className="w-[38%]">
                  Field
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell scope="col" className="min-w-0">
                  Value
                </EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {federationIdentifiers.map((identifier, index) => (
                <EnterpriseTableRow
                  key={identifier.id}
                  className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                >
                  <EnterpriseTableHeaderCell scope="row" className="align-top w-[38%]">
                    <span className="inline-flex items-center gap-1">
                      <span>{identifier.label}</span>
                      <FieldHelpTooltip label={identifier.label} hint={identifier.hint} />
                    </span>
                  </EnterpriseTableHeaderCell>
                  <EnterpriseTableCell className="min-w-0 break-all font-mono text-sm align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={identifier.isPlaceholder ? "text-al-text-secondary" : undefined}>
                        {identifier.value}
                      </span>
                      {identifier.isPlaceholder ? (
                        <StatusTag kind="neutral" label="Replace" data-testid={`aws-trust-starter-placeholder-${identifier.id}`} />
                      ) : (
                        <StatusTag kind="ready" label="Confirmed" data-testid={`aws-trust-starter-confirmed-${identifier.id}`} />
                      )}
                    </div>
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
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
            Copy trust policy
          </Button>
        </div>
        {copyFeedback !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status" aria-live="polite">
            {copyFeedback}
          </p>
        ) : null}
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
          {trustPolicyReplaceHint}
        </p>
      </div>
    </div>
  );
}
