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
} from "@/lib/trust-evidence-display";
import type { RunTrustEvidenceCard } from "@/types/authority";

/** One Evidence-basis field plus the diagnostics clauses withheld from primary content. */
export type EvidenceBasisField = TrustEvidenceReadinessField & {
  readonly technical: string | null;
};

/** Builds one Evidence-basis field, splitting diagnostics clauses out of the buyer-facing detail. */
function evidenceBasisField(
  key: string,
  title: string,
  snapshot: { readonly title: string; readonly status: string; readonly detail?: string | null },
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

export function buildEvidenceBasisFields(card: RunTrustEvidenceCard, buyerPolishedShell: boolean): EvidenceBasisField[] {
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
