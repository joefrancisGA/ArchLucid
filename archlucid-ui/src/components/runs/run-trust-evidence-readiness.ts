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
import { trustEvidenceFieldOrUnavailable } from "@/lib/trust-evidence-field-snapshot";
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
  const executionMode = trustEvidenceFieldOrUnavailable(card.executionMode, "Execution mode");
  const goldenManifest = trustEvidenceFieldOrUnavailable(card.goldenManifest, "Golden manifest");
  const auditTrail = trustEvidenceFieldOrUnavailable(card.auditTrail, "Audit trail");
  const agentTraces = trustEvidenceFieldOrUnavailable(card.agentTraces, "Agent traces");
  const artifactBundlePointer = trustEvidenceFieldOrUnavailable(card.artifactBundlePointer, "Artifact bundle");
  const traceabilityExport = trustEvidenceFieldOrUnavailable(card.traceabilityExport, "Traceability export");
  const aiExplainability = trustEvidenceFieldOrUnavailable(card.aiExplainability, "AI explainability");

  const proofConfidenceLabel = buyerPolishedShell
    ? formatProofConfidenceBuyerLabelFromTrustStatus(executionMode.status)
    : formatProofConfidenceLabelFromTrustStatus(executionMode.status);

  return [
    {
      key: "proof-confidence",
      title: PROOF_CONFIDENCE_FIELD_LABEL,
      status: proofConfidenceLabel,
      // Distinct from Execution mode below — both fields previously rendered the same API detail string.
      detail: proofConfidenceFieldDetail(proofConfidenceLabel),
      technical: null,
    },
    evidenceBasisField("execution", executionMode.title, executionMode),
    evidenceBasisField(
      "manifest",
      trustEvidenceGoldenManifestFieldTitle(goldenManifest.title, buyerPolishedShell),
      {
        ...goldenManifest,
        detail: trustEvidenceGoldenManifestFieldDetail(goldenManifest.detail),
      },
    ),
    evidenceBasisField("audit", auditTrail.title, auditTrail),
    evidenceBasisField("traces", agentTraces.title, agentTraces),
    evidenceBasisField("bundle", artifactBundlePointer.title, artifactBundlePointer),
    evidenceBasisField("zip", traceabilityExport.title, traceabilityExport),
    evidenceBasisField("ai", aiExplainability.title, aiExplainability),
  ];
}

/** Shared readiness rollup for the Evidence tab scope header and trust-evidence card body. */
export function deriveRunTrustEvidenceReadinessFromCard(
  card: RunTrustEvidenceCard,
  buyerPolishedShell: boolean,
) {
  return deriveTrustEvidenceReadiness(buildEvidenceBasisFields(card, buyerPolishedShell));
}
