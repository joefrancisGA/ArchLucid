import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { evidenceAbsenceFindingLabel, isEvidenceAbsenceFindingTitle } from "@/lib/evidence-absence-finding-copy";
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
  resolveTrustEvidenceProductLink,
} from "@/lib/trust-evidence-product-links";
import { trustEvidenceStatusTag } from "@/lib/trust-evidence-status-tag";
import type { RunTrustEvidenceCard, RunTrustEvidenceRouteRef, TrustEvidenceFieldSnapshot } from "@/types/authority";

import { StatusTag } from "@/components/ui/status-tag";

/** Status used when a finding is on record but only reports that evidence found nothing. */
const RECORDED_STATUS = "Recorded";

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

export function RunTrustEvidenceProofChain(props: {
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
          How evidence flows from source to audit log
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
