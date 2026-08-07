import { cn } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/finding-policy-evidence-citations";
import type { FindingInspectEvidence } from "@/types/finding-inspect";

import { FindingInspectPolicyRuleCallout } from "./FindingInspectPolicyRuleCallout";

export type FindingInspectEvidenceSectionProps = {
  readonly demoFillGaps: boolean;
  readonly reviewContextHref: string;
  readonly reviewContextLabel: string;
  readonly evidence: FindingInspectEvidence[];
  readonly citationModel?: FindingPolicyEvidenceCitationModel | null;
};

function evidenceCitationTitle(row: FindingInspectEvidence): string {
  const excerpt = row.excerpt?.trim() ?? "";

  if (excerpt.length > 0) {
    const firstClause = excerpt.split(/[.—]/)[0]?.trim() ?? excerpt;

    if (firstClause.length > 0 && firstClause.length <= 80) {
      return firstClause;
    }

    return excerpt.length > 80 ? `${excerpt.slice(0, 77)}…` : excerpt;
  }

  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return artifact.replace(/-/g, " ");
  }

  return "Cited evidence";
}

function evidenceLinkLabel(row: FindingInspectEvidence, fallbackLabel: string): string {
  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return `Open ${artifact}`;
  }

  return fallbackLabel;
}

function EvidenceExcerptBody({ text }: { readonly text: string }): ReactElement {
  const proseLike = text.includes(" ") && text.length > 24;

  if (proseLike) {
    return <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{text}</p>;
  }

  return <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{text}</span>;
}

function DemoEvidenceScaffold(props: {
  readonly reviewContextHref: string;
}): ReactElement {
  return (
    <ul className={cn("mt-2 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
      <li className="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/60">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Claims intake API schema</p>
        <p className="m-0 mt-2 leading-relaxed text-neutral-800 dark:text-neutral-200">
          Request schema includes unredacted member ID and date of birth fields referenced by the adjudication
          subgraph.
        </p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Linked in the evidence trail and signed review record for this review.
        </p>
        <div className="mt-2">
          <Link href={props.reviewContextHref} className={OPERATOR_LINK.optional}>
            Open cited evidence
          </Link>
        </div>
      </li>
    </ul>
  );
}

function EvidenceCitationList(props: {
  readonly evidence: FindingInspectEvidence[];
  readonly reviewContextHref: string;
  readonly reviewContextLabel: string;
  readonly buyerPolishedShell: boolean;
  readonly citationEvidence?: readonly { readonly label: string; readonly href: string }[];
}): ReactElement {
  const { evidence, reviewContextHref, reviewContextLabel, buyerPolishedShell } = props;

  if (evidence.length === 0) {
    return (
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No related graph citations on file.</p>
    );
  }

  return (
    <ul className={cn("mt-2 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
      {evidence.map((row, idx) => {
        const excerpt = row.excerpt?.trim() ?? "";
        const title = evidenceCitationTitle(row);
        const citationRow = props.citationEvidence?.[idx];
        const href = citationRow?.href ?? reviewContextHref;
        const linkLabel = citationRow?.label ?? evidenceLinkLabel(row, reviewContextLabel);

        return (
          <li
            key={`${row.excerpt ?? "ev"}-${row.artifactId ?? ""}-${idx}`}
            className="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
          >
            <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
            {excerpt.length > 0 && excerpt !== title ? <EvidenceExcerptBody text={excerpt} /> : null}
            {buyerPolishedShell && (row.lineRange || row.artifactId) ? (
              <details className="mt-2">
                <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                  View technical citation
                </summary>
                <div className={cn("mt-1 space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {row.lineRange ? <p className="m-0">Lines: {row.lineRange}</p> : null}
                  {row.artifactId ? <p className="m-0 font-mono">Artifact id: {row.artifactId}</p> : null}
                </div>
              </details>
            ) : (
              <>
                {row.lineRange ? (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Lines: {row.lineRange}</p>
                ) : null}
                {row.artifactId ? (
                  <p className={cn("m-0 mt-1 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Artifact id: {row.artifactId}
                  </p>
                ) : null}
              </>
            )}
            <div className="mt-2">
              <Link href={href} className={OPERATOR_LINK.optional} data-testid="finding-source-evidence-link">
                {linkLabel}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Customer policy rule plus architecture evidence citations for finding inspect surfaces. */
export function FindingInspectEvidenceSection({
  demoFillGaps,
  reviewContextHref,
  reviewContextLabel,
  evidence,
  citationModel = null,
}: FindingInspectEvidenceSectionProps): ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const policy = citationModel?.policy ?? null;
  const pack = citationModel?.pack ?? null;
  const hasPolicyContext = policy !== null;
  const sectionTitle = hasPolicyContext ? "Customer policy & evidence" : "Evidence citations";
  const evidenceHeading = hasPolicyContext ? "Supporting architecture evidence" : null;

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-label={sectionTitle}
      data-testid="finding-inspect-evidence-section"
    >
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{sectionTitle}</h2>

      {hasPolicyContext ? (
        <FindingInspectPolicyRuleCallout pack={pack} policy={policy} className="mt-3" />
      ) : null}

      {evidenceHeading !== null ? (
        <h3 className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
          {evidenceHeading}
        </h3>
      ) : null}

      {evidence.length === 0 ? (
        demoFillGaps ? (
          <DemoEvidenceScaffold reviewContextHref={reviewContextHref} />
        ) : (
          <EvidenceCitationList
            evidence={evidence}
            reviewContextHref={reviewContextHref}
            reviewContextLabel={reviewContextLabel}
            buyerPolishedShell={buyerPolishedShell}
            citationEvidence={citationModel?.evidence}
          />
        )
      ) : (
        <EvidenceCitationList
          evidence={evidence}
          reviewContextHref={reviewContextHref}
          reviewContextLabel={reviewContextLabel}
          buyerPolishedShell={buyerPolishedShell}
          citationEvidence={citationModel?.evidence}
        />
      )}
    </section>
  );
}
