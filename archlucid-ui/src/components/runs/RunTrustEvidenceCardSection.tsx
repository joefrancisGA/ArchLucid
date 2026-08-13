import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FindingEvidenceTrailLink } from "@/components/usability/FindingEvidenceTrailLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { operatorSemanticSurface, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { evidenceAbsenceFindingLabel, isEvidenceAbsenceFindingTitle } from "@/lib/evidence-absence-finding-copy";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import {
  formatProofConfidenceBuyerLabelFromTrustStatus,
  formatProofConfidenceLabelFromTrustStatus,
  PROOF_CONFIDENCE_FIELD_LABEL,
} from "@/lib/proof-confidence-taxonomy";
import { deriveTrustEvidenceReadiness, type TrustEvidenceReadinessField } from "@/lib/trust-evidence-readiness";
import { proofConfidenceFieldDetail } from "@/lib/trust-evidence-proof-confidence-detail";
import {
  splitTrustEvidenceDetail,
  trustEvidenceFieldTitleForDisplay,
} from "@/lib/trust-evidence-technical-detail";
import {
  trustEvidenceGoldenManifestFieldDetail,
  trustEvidenceGoldenManifestFieldTitle,
  trustEvidenceProofChainManifestStepLabel,
} from "@/lib/trust-evidence-display";
import {
  resolveTrustEvidenceDiagnosticsApiPath,
  resolveTrustEvidenceProductLink,
} from "@/lib/trust-evidence-product-links";
import { trustEvidenceStatusTag } from "@/lib/trust-evidence-status-tag";
import type { RunTrustEvidenceCard, RunTrustEvidenceRouteRef, TrustEvidenceFieldSnapshot } from "@/types/authority";

/** Status used when a finding is on record but only reports that evidence found nothing. */
const RECORDED_STATUS = "Recorded";

/** One Evidence-basis field plus the diagnostics clauses withheld from primary content. */
type EvidenceBasisField = TrustEvidenceReadinessField & {
  readonly technical: string | null;
};

function linkByRel(links: readonly RunTrustEvidenceRouteRef[], rel: string): RunTrustEvidenceRouteRef | null {
  return links.find((link) => link.rel === rel) ?? null;
}

function proofStepTone(field: TrustEvidenceFieldSnapshot): string {
  const key = field.status.trim().toLowerCase();

  if (key === "available") {
    return operatorSemanticSurface("ready");
  }

  // A recorded absence is on file but is not verified proof — keep it out of the ready/green treatment.
  if (key === "recorded" || key === "demo-only") {
    return operatorSemanticSurface("info");
  }

  return operatorSemanticSurface("warn");
}

function FieldRow(props: {
  readonly title: string;
  readonly status: string;
  readonly detail?: string | null;
}): ReactElement {
  const { title, status, detail } = props;
  const tag = trustEvidenceStatusTag(status);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className={cn("font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{title}</div>
        <StatusTag kind={tag.kind} label={tag.label} />
      </div>
      {detail ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{detail}</p>
      ) : null}
    </div>
  );
}

function ProofChainStep(props: {
  readonly index: number;
  readonly label: string;
  readonly field: TrustEvidenceFieldSnapshot;
  readonly productLink?: { readonly href: string; readonly label: string } | null;
}): ReactElement {
  const { index, label, field, productLink = null } = props;
  const unavailable = field.status.trim().toLowerCase() !== "available";
  const tag = trustEvidenceStatusTag(field.status);

  return (
    <li className={`rounded-lg border p-3 ${proofStepTone(field)}`} data-testid={`proof-chain-step-${index}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
            Step {index}: {label}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{field.title}</p>
        </div>
        <StatusTag kind={tag.kind} label={tag.label} />
      </div>
      {field.detail ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{field.detail}</p>
      ) : null}
      {productLink !== null ? (
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.nav} href={productLink.href}>
            {productLink.label}
          </Link>
        </p>
      ) : unavailable && field.status.trim().toLowerCase() !== RECORDED_STATUS.toLowerCase() ? (
        <p className={cn("m-0 mt-2 font-medium text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
          Supporting link unavailable — regenerate this evidence before sharing the package.
        </p>
      ) : null}
    </li>
  );
}

/** Step 2 subject: a finding that only records an absence must not read as verified proof. */
function proofChainFindingField(card: RunTrustEvidenceCard): TrustEvidenceFieldSnapshot {
  const rawTitle = card.topFinding?.title ?? null;
  const pointers = splitTrustEvidenceDetail(card.topFinding?.evidencePointersSummary);

  if (card.topFinding == null) {
    return {
      title: "Top finding evidence chain",
      status: "Missing",
      detail: "No top finding evidence-chain pointer is available.",
    };
  }

  if (rawTitle !== null && isEvidenceAbsenceFindingTitle(rawTitle)) {
    return {
      title: evidenceAbsenceFindingLabel(rawTitle),
      status: RECORDED_STATUS,
      detail: "This finding records that evidence found nothing to report — it is not verified proof of coverage.",
    };
  }

  return {
    title: rawTitle ?? "Top finding evidence chain",
    status: "Available",
    detail: pointers.display,
  };
}

function ProofChainView(props: {
  readonly card: RunTrustEvidenceCard;
  readonly runId: string;
  readonly buyerPolishedShell: boolean;
}): ReactElement {
  const { card, runId, buyerPolishedShell } = props;
  const evidenceLink = linkByRel(card.links, "evidence");
  const topFindingLink = linkByRel(card.links, "topFindingEvidenceChain");
  const traceabilityLink = linkByRel(card.links, "traceabilityZip");
  const tracesLink = linkByRel(card.links, "traces");
  const manifestDetail = splitTrustEvidenceDetail(
    trustEvidenceGoldenManifestFieldDetail(card.goldenManifest.detail),
  );
  const bundleDetail = splitTrustEvidenceDetail(card.artifactBundlePointer.detail);
  const auditField = card.auditTrail.status.trim().toLowerCase() === "available" ? card.auditTrail : card.agentTraces;
  const topFindingId = card.topFinding?.findingId ?? null;

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/45"
      data-testid="evidence-to-manifest-audit-proof-chain"
    >
      <div className="space-y-1">
        <h4 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Evidence → finding → review record → artifact → audit proof chain
        </h4>
        <p className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          This chain links sponsor-facing claims to stored evidence, findings, the committed review record, exportable
          artifacts, and audit metadata for this package. It is not a legal attestation.
        </p>
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <ProofChainStep
          index={1}
          label="Evidence"
          field={card.aiExplainability}
          productLink={evidenceLink !== null ? resolveTrustEvidenceProductLink(evidenceLink, runId, topFindingId) : null}
        />
        <ProofChainStep
          index={2}
          label="Finding"
          field={proofChainFindingField(card)}
          productLink={
            topFindingLink !== null ? resolveTrustEvidenceProductLink(topFindingLink, runId, topFindingId) : null
          }
        />
        <ProofChainStep
          index={3}
          label={trustEvidenceProofChainManifestStepLabel()}
          field={{
            ...card.goldenManifest,
            title: trustEvidenceGoldenManifestFieldTitle(card.goldenManifest.title, buyerPolishedShell),
            detail: manifestDetail.display,
          }}
        />
        <ProofChainStep
          index={4}
          label="Artifact"
          field={{
            ...card.artifactBundlePointer,
            title: trustEvidenceFieldTitleForDisplay(card.artifactBundlePointer.title),
            detail: bundleDetail.display,
          }}
          productLink={
            traceabilityLink !== null ? resolveTrustEvidenceProductLink(traceabilityLink, runId, topFindingId) : null
          }
        />
        <ProofChainStep
          index={5}
          label="Audit"
          field={auditField}
          productLink={tracesLink !== null ? resolveTrustEvidenceProductLink(tracesLink, runId, topFindingId) : null}
        />
      </ol>
    </div>
  );
}

/** Builds one Evidence-basis field, splitting diagnostics clauses out of the buyer-facing detail. */
function evidenceBasisField(
  key: string,
  title: string,
  snapshot: TrustEvidenceFieldSnapshot,
): EvidenceBasisField {
  const split = splitTrustEvidenceDetail(snapshot.detail);

  return {
    key,
    title: trustEvidenceFieldTitleForDisplay(title),
    status: snapshot.status,
    detail: split.display,
    technical: split.technical,
  };
}

function buildEvidenceBasisFields(card: RunTrustEvidenceCard, buyerPolishedShell: boolean): EvidenceBasisField[] {
  const proofConfidenceLabel = buyerPolishedShell
    ? formatProofConfidenceBuyerLabelFromTrustStatus(card.executionMode.status)
    : formatProofConfidenceLabelFromTrustStatus(card.executionMode.status);

  return [
    {
      key: "proof-confidence",
      title: PROOF_CONFIDENCE_FIELD_LABEL,
      status: proofConfidenceLabel,
      // Distinct from Execution mode below — both fields previously rendered the same API detail string.
      detail: proofConfidenceFieldDetail(proofConfidenceLabel),
      technical: null,
    },
    evidenceBasisField("execution", card.executionMode.title, card.executionMode),
    evidenceBasisField(
      "manifest",
      trustEvidenceGoldenManifestFieldTitle(card.goldenManifest.title, buyerPolishedShell),
      {
        ...card.goldenManifest,
        detail: trustEvidenceGoldenManifestFieldDetail(card.goldenManifest.detail),
      },
    ),
    evidenceBasisField("audit", card.auditTrail.title, card.auditTrail),
    evidenceBasisField("traces", card.agentTraces.title, card.agentTraces),
    evidenceBasisField("bundle", card.artifactBundlePointer.title, card.artifactBundlePointer),
    evidenceBasisField("zip", card.traceabilityExport.title, card.traceabilityExport),
    evidenceBasisField("ai", card.aiExplainability.title, card.aiExplainability),
  ];
}

/** Shared readiness rollup for the Evidence tab scope header and trust-evidence card body. */
export function deriveRunTrustEvidenceReadinessFromCard(
  card: RunTrustEvidenceCard,
  buyerPolishedShell: boolean,
) {
  return deriveTrustEvidenceReadiness(buildEvidenceBasisFields(card, buyerPolishedShell));
}

/** Committed-run evidence summary: manifest/audit/traces/export posture (no CPA / pen-test / legal claims). */
export function RunTrustEvidenceCardSection(props: {
  readonly card: RunTrustEvidenceCard;
  readonly evidenceAskRunId?: string | null;
  readonly runId: string;
  readonly blockingFindingId?: string | null;
  readonly blockingFindingTitle?: string | null;
  readonly approvalBlocked?: boolean;
}): ReactElement {
  const { card, evidenceAskRunId, runId, blockingFindingId, blockingFindingTitle, approvalBlocked } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const trimmedAskRun =
    buyerPolishedShell && typeof evidenceAskRunId === "string" ? evidenceAskRunId.trim() : "";

  const fields = buildEvidenceBasisFields(card, buyerPolishedShell);
  const readiness = deriveTrustEvidenceReadiness(fields);
  const technicalRows = fields.filter((field) => field.technical !== null);
  const topFindingPointers = splitTrustEvidenceDetail(card.topFinding?.evidencePointersSummary);
  const trimmedBlockingFindingId =
    typeof blockingFindingId === "string" ? blockingFindingId.trim() : "";
  const trimmedBlockingFindingTitle =
    typeof blockingFindingTitle === "string" ? blockingFindingTitle.trim() : "";
  const showApprovalBlockerLink =
    approvalBlocked === true
    && trimmedBlockingFindingId.length > 0
    && trimmedBlockingFindingTitle.length > 0;
  const findingsTabHref = buildReviewDetailTabHref(runId, "findings", {
    hash: `finding-workspace-card-${trimmedBlockingFindingId}`,
  });

  return (
    <section id="trust-evidence" className="scroll-mt-24">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <h3 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Evidence basis
          </h3>

          {showApprovalBlockerLink ? (
            <p
              className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
              data-testid="trust-evidence-approval-blocker-link"
            >
              Approval is blocked by{" "}
              <Link className={OPERATOR_LINK.nav} href={findingsTabHref}>
                {trimmedBlockingFindingTitle}
              </Link>
              .{" "}
              <FindingEvidenceTrailLink
                runId={runId}
                findingId={trimmedBlockingFindingId}
                label="Open finding evidence trail"
              />
            </p>
          ) : null}

          {readiness.exceptions.length > 0 ? (
            <div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="trust-evidence-exception-fields"
            >
              {readiness.exceptions.map((field) => (
                <FieldRow key={field.key} title={field.title} status={field.status} detail={field.detail} />
              ))}
            </div>
          ) : null}

          {trimmedAskRun.length > 0 ? (
            <div
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid="trust-evidence-ask-promotion"
            >
              <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
                Ask evidence-backed questions about this review
              </p>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Answers reference this review&apos;s persisted summary, signed review record, and cited evidence where your workspace
                allows.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/insights/ask-review-questions?runId=${encodeURIComponent(trimmedAskRun)}`}>Ask about this review</Link>
                </Button>
              </div>
            </div>
          ) : null}

          {card.topFinding ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
              <div className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Top finding evidence (severity-first)
              </div>
              <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {card.topFinding.title
                  ? evidenceAbsenceFindingLabel(card.topFinding.title)
                  : "Top finding evidence chain"}
              </p>
              <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Trace completeness: <strong>{card.topFinding.traceCompletenessLabel}</strong>
              </p>
              {topFindingPointers.display ? (
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                  {topFindingPointers.display}
                </p>
              ) : null}
            </div>
          ) : null}

          <CollapsibleSection
            title="All evidence fields"
            headingLevel={4}
            summaryLine={`${readiness.satisfied.length} field${readiness.satisfied.length === 1 ? "" : "s"} need no attention`}
            defaultOpen={false}
            sectionTestId="trust-evidence-satisfied-fields"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {readiness.satisfied.map((field) => (
                <FieldRow key={field.key} title={field.title} status={field.status} detail={field.detail} />
              ))}
            </div>
          </CollapsibleSection>

          <ProofChainView card={card} runId={runId} buyerPolishedShell={buyerPolishedShell} />

          <section aria-labelledby="trust-evidence-scope-limitations">
            <h4 id="trust-evidence-scope-limitations" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Scope and limitations
            </h4>
            <p className={cn("m-0 mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {card.selfAttestationNotice}
            </p>
          </section>

          <CollapsibleSection
            title="Technical details (diagnostics)"
            headingLevel={4}
            summaryLine="Identifiers, versions, and API routes for support and audit"
            defaultOpen={false}
            sectionTestId="trust-evidence-technical-details"
          >
            {technicalRows.length > 0 ? (
              <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
                {technicalRows.map((field) => (
                  <div key={field.key}>
                    <dt className="font-medium text-neutral-700 dark:text-neutral-300">{field.title}</dt>
                    <dd className={cn("m-0 break-all font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                      {field.technical}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {card.topFinding ? (
              <div className="mt-3">
                <div className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  Top finding
                </div>
                <p className={cn("m-0 break-all font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                  {card.topFinding.findingId}
                  {topFindingPointers.technical !== null ? ` — ${topFindingPointers.technical}` : ""}
                </p>
              </div>
            ) : null}
            <div className="mt-3">
              <div className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {buyerPolishedShell ? "Operator diagnostics API routes" : "Evidence routes (operator diagnostics)"}
              </div>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}>
                {card.links.map((link) => (
                  <li key={link.rel}>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{link.label}: </span>
                    <Link className="underline" href={resolveTrustEvidenceDiagnosticsApiPath(link.path)}>
                      {link.path}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
