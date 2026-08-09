import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { enterpriseStatusTagClass, operatorSemanticSurface, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { evidenceAbsenceFindingLabel, isEvidenceAbsenceFindingTitle } from "@/lib/evidence-absence-finding-copy";
import {
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
import type { RunTrustEvidenceCard, RunTrustEvidenceRouteRef, TrustEvidenceFieldSnapshot } from "@/types/authority";

/** Status used when a finding is on record but only reports that evidence found nothing. */
const RECORDED_STATUS = "Recorded";

/** One Evidence-basis field plus the diagnostics clauses withheld from primary content. */
type EvidenceBasisField = TrustEvidenceReadinessField & {
  readonly technical: string | null;
};

function proxyApiPath(path: string): string {
  if (path.startsWith("/v1/")) {
    return `/api/proxy${path}`;
  }

  return path;
}

function statusClass(status: string): string {
  const key = status.trim().toLowerCase();

  if (key === "available") {
    return enterpriseStatusTagClass("ready");
  }

  if (key === "missing") {
    return enterpriseStatusTagClass("needs-attention");
  }

  if (key === "demo-only") {
    return enterpriseStatusTagClass("in-progress");
  }

  if (key === "low confidence") {
    return enterpriseStatusTagClass("needs-attention");
  }

  if (key === "not applicable") {
    return enterpriseStatusTagClass("neutral");
  }

  return enterpriseStatusTagClass("neutral");
}

function FieldRow(props: {
  readonly title: string;
  readonly status: string;
  readonly detail?: string | null;
}): ReactElement {
  const { title, status, detail } = props;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className={cn("font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{title}</div>
        <span className={cn("rounded px-2 py-0.5 font-semibold", OPERATOR_TYPOGRAPHY.badge, statusClass(status))}>{status}</span>
      </div>
      {detail ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{detail}</p>
      ) : null}
    </div>
  );
}

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

function ProofChainStep(props: {
  readonly index: number;
  readonly label: string;
  readonly field: TrustEvidenceFieldSnapshot;
  readonly href?: string | null;
  readonly linkLabel?: string;
}): ReactElement {
  const { index, label, field, href, linkLabel } = props;
  const unavailable = field.status.trim().toLowerCase() !== "available";

  return (
    <li className={`rounded-lg border p-3 ${proofStepTone(field)}`} data-testid={`proof-chain-step-${index}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>
            Step {index}: {label}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{field.title}</p>
        </div>
        <span className={cn("rounded px-2 py-0.5 font-semibold", OPERATOR_TYPOGRAPHY.badge, statusClass(field.status))}>{field.status}</span>
      </div>
      {field.detail ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{field.detail}</p>
      ) : null}
      {href ? (
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.nav} href={proxyApiPath(href)}>
            {linkLabel ?? "Open supporting evidence"}
          </Link>
        </p>
      ) : unavailable && field.status.trim().toLowerCase() !== RECORDED_STATUS.toLowerCase() ? (
        <p className={cn("m-0 mt-2 font-medium text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
          WARN: supporting link is missing; collect or regenerate proof before sponsor send.
        </p>
      ) : null}
    </li>
  );
}

/** Step 2 subject: a finding that only records an absence must not read as verified proof. */
function proofChainFindingField(card: RunTrustEvidenceCard): TrustEvidenceFieldSnapshot {
  const rawTitle = card.topFinding?.title ?? null;
  const pointers = splitTrustEvidenceDetail(card.topFinding?.evidencePointersSummary);

  if (card.topFinding === null || card.topFinding === undefined) {
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

function ProofChainView(props: { readonly card: RunTrustEvidenceCard; readonly buyerPolishedShell: boolean }): ReactElement {
  const { card, buyerPolishedShell } = props;
  const evidenceLink = linkByRel(card.links, "evidence");
  const topFindingLink = linkByRel(card.links, "topFindingEvidenceChain");
  const traceabilityLink = linkByRel(card.links, "traceabilityZip");
  const tracesLink = linkByRel(card.links, "traces");
  const manifestDetail = splitTrustEvidenceDetail(
    trustEvidenceGoldenManifestFieldDetail(card.goldenManifest.detail),
  );
  const bundleDetail = splitTrustEvidenceDetail(card.artifactBundlePointer.detail);
  const auditField = card.auditTrail.status.trim().toLowerCase() === "available" ? card.auditTrail : card.agentTraces;

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/45"
      data-testid="evidence-to-manifest-audit-proof-chain"
    >
      <div className="space-y-1">
        <h4 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Evidence → finding → review record → artifact → audit proof chain
        </h4>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          This chain shows why a committed ArchLucid review is stronger than a free-form AI answer: each sponsor-facing
          claim can point back to stored evidence, a finding, a committed review record, an exportable artifact, and durable
          audit or trace metadata. It is not a legal attestation.
        </p>
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <ProofChainStep
          index={1}
          label="Evidence"
          field={card.aiExplainability}
          href={evidenceLink?.path}
          linkLabel={evidenceLink?.label}
        />
        <ProofChainStep
          index={2}
          label="Finding"
          field={proofChainFindingField(card)}
          href={topFindingLink?.path}
          linkLabel={topFindingLink?.label}
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
          href={traceabilityLink?.path}
          linkLabel={traceabilityLink?.label}
        />
        <ProofChainStep
          index={5}
          label="Audit"
          field={auditField}
          href={tracesLink?.path}
          linkLabel={tracesLink?.label}
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
  const proofConfidenceLabel = formatProofConfidenceLabelFromTrustStatus(card.executionMode.status);

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

/** Committed-run evidence summary: manifest/audit/traces/export posture (no CPA / pen-test / legal claims). */
export function RunTrustEvidenceCardSection(props: {
  readonly card: RunTrustEvidenceCard;
  readonly evidenceAskRunId?: string | null;
}): ReactElement {
  const { card, evidenceAskRunId } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const trimmedAskRun =
    buyerPolishedShell && typeof evidenceAskRunId === "string" ? evidenceAskRunId.trim() : "";

  const fields = buildEvidenceBasisFields(card, buyerPolishedShell);
  const readiness = deriveTrustEvidenceReadiness(fields);
  const technicalRows = fields.filter((field) => field.technical !== null);
  const topFindingPointers = splitTrustEvidenceDetail(card.topFinding?.evidencePointersSummary);

  return (
    <section id="trust-evidence" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={cn("m-0 tracking-tight text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {buyerPolishedShell ? "Evidence basis" : "Evidence basis (operational)"}
          </h3>
          <CardDescription className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {card.selfAttestationNotice}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={readiness.verdict === "complete" ? operatorSemanticSurface("ready") : operatorSemanticSurface("warn")}
            data-testid="trust-evidence-readiness-verdict"
            role="status"
          >
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
              {readiness.headline}
            </p>
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {readiness.readyCount} of {readiness.totalCount} evidence fields are available for this review.
            </p>
          </div>

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

          <ProofChainView card={card} buyerPolishedShell={buyerPolishedShell} />

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
                {/* Secondary on purpose — the review's recommended next step owns the single primary affordance. */}
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

          <CollapsibleSection
            title="Technical details (diagnostics)"
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
                {buyerPolishedShell ? "Evidence API endpoints" : "Evidence routes"}
              </div>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}>
                {card.links.map((l) => (
                  <li key={l.rel}>
                    <Link className="underline" href={proxyApiPath(l.path)}>
                      {l.label}
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
