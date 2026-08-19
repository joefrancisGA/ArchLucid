"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  IMPACT_PREVIEW_BASELINE_REVIEW_ID_LABEL,
  IMPACT_PREVIEW_EVIDENCE_BASIS_TITLE,
  IMPACT_PREVIEW_EVIDENCE_LINKED_FINDINGS,
  IMPACT_PREVIEW_EVIDENCE_POLICY_RULES,
  IMPACT_PREVIEW_EVIDENCE_REVIEW_BASELINE,
  IMPACT_PREVIEW_GOVERNANCE_HREF,
} from "@/lib/impact-preview-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ImpactPreviewEvidenceBasisSectionProps = {
  readonly baselineRunId: string | null;
  readonly linkedRunIds: readonly string[];
  readonly policyRulesLabel: string;
};

export function ImpactPreviewEvidenceBasisSection(props: ImpactPreviewEvidenceBasisSectionProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const baselineHref =
    props.baselineRunId !== null
      ? `/architecture/reviews/${encodeURIComponent(props.baselineRunId)}`
      : null;

  return (
    <Card data-testid="impact-preview-evidence-basis-section">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{IMPACT_PREVIEW_EVIDENCE_BASIS_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className={cn("m-0 grid gap-3", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className="text-al-text-secondary">{IMPACT_PREVIEW_EVIDENCE_REVIEW_BASELINE}</dt>
            <dd className="m-0 mt-1">
              {baselineHref !== null ? (
                buyerPolishedShell ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <Link href={baselineHref} className={OPERATOR_LINK.inline}>
                      Open baseline review
                    </Link>
                    <TechnicalIdDisclosure
                      label={IMPACT_PREVIEW_BASELINE_REVIEW_ID_LABEL}
                      value={props.baselineRunId}
                    />
                  </span>
                ) : (
                  <Link href={baselineHref} className={OPERATOR_LINK.inline}>
                    {props.baselineRunId}
                  </Link>
                )
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">{IMPACT_PREVIEW_EVIDENCE_LINKED_FINDINGS}</dt>
            <dd className="m-0 mt-1 text-al-text-primary">
              {props.linkedRunIds.length > 0
                ? `${props.linkedRunIds.length} linked review${props.linkedRunIds.length === 1 ? "" : "s"} from planning`
                : "No linked reviews recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">{IMPACT_PREVIEW_EVIDENCE_POLICY_RULES}</dt>
            <dd className="m-0 mt-1">
              <Link href={IMPACT_PREVIEW_GOVERNANCE_HREF} className={OPERATOR_LINK.inline}>
                {props.policyRulesLabel}
              </Link>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
