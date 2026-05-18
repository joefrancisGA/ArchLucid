import { isBuyerTrailPhiHeroNode } from "@/lib/graph-mapper";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

export type BuyerTrailMetadataLine = {
  readonly label: string;
  readonly value: string;
};

function titleCaseSlug(slug: string): string {
  const parts = slug.split(/[-_/]/g).filter((p) => p.length > 0);

  if (parts.length === 0) {
    return slug;
  }

  return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

const KNOWN_REFERENCE_SLUGS: Record<string, string> = {
  [SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID]: "PHI Minimization Risk",
};

/**
 * Buyer-trail panel: one-line disposition when inferable from metadata (showcase PHI finding or explicit disposition keys).
 */
export function graphBuyerTrailDispositionLine(
  nodeType: string,
  metadata: Record<string, string> | undefined,
): string | null {
  if (nodeType !== "Finding") {
    return null;
  }

  if (metadata === undefined) {
    return null;
  }

  for (const [rawKey, rawVal] of Object.entries(metadata)) {
    const key = rawKey.trim().toLowerCase();

    if (key === "disposition" || key === "riskdisposition" || key === "findingdisposition") {
      const value = String(rawVal).trim();

      if (value.length > 0) {
        return value;
      }
    }
  }

  const referenceId = (metadata.referenceId ?? metadata.ReferenceId ?? "").trim();
  const referencedSlug = (metadata.referenced ?? "").trim();

  if (
    referenceId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID ||
    referencedSlug === "phi-minimization-risk"
  ) {
    return "Accepted with monitoring — non-blocking for go-live; governance cadence covers unstructured attachment exceptions.";
  }

  return null;
}

/** Buyer trail panel: human record type line (Finding vs risk finding vs other node types). */
export function graphBuyerTrailRecordTypeLine(node: GraphNodeVm): {
  readonly primary: string;
  readonly secondary: string | null;
} {
  if (isBuyerTrailPhiHeroNode(node)) {
    return {
      primary: "Risk finding",
      secondary: "Risk area: PHI minimization",
    };
  }

  if (node.type === "Finding") {
    return { primary: "Finding", secondary: null };
  }

  return { primary: node.type, secondary: null };
}

/** Splits graph node metadata into sponsor-facing lines vs. technical key–value pairs (buyer trail panel). */
export function graphBuyerTrailMetadataLines(
  metadata: Record<string, string> | undefined,
): {
  readonly summaryLines: BuyerTrailMetadataLine[];
  readonly technicalLines: BuyerTrailMetadataLine[];
} {
  if (metadata === undefined || Object.keys(metadata).length === 0) {
    return { summaryLines: [], technicalLines: [] };
  }

  const summaryLines: BuyerTrailMetadataLine[] = [];
  const technicalLines: BuyerTrailMetadataLine[] = [];

  for (const [rawKey, rawVal] of Object.entries(metadata)) {
    const key = rawKey.trim();
    const value = String(rawVal).trim();

    if (key.length === 0) {
      continue;
    }

    const lower = key.toLowerCase();

    if (lower === "referenceid") {
      if (value === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
        summaryLines.push({
          label: "Risk area",
          value: "PHI minimization at intake — classification, lineage, and retention posture.",
        });
        summaryLines.push({
          label: "Why it matters",
          value:
            "Mis-handled PHI creates compliance exposure and sponsor distrust; this finding ties evidence to the signed manifest.",
        });
      }

      technicalLines.push({ label: "Reference ID", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "riskarea" || lower === "risk_domain" || lower === "riskdomain") {
      summaryLines.push({ label: "Risk area", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (
      lower === "whyitmatters" ||
      lower === "whymatters" ||
      lower === "businessmeaning" ||
      lower === "sponsorimpact"
    ) {
      summaryLines.push({ label: "Why it matters", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "evidence" || lower === "citations" || lower === "evidencecitations") {
      summaryLines.push({ label: "Evidence citations", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "mitigation" || lower === "remediation") {
      summaryLines.push({ label: "Mitigation", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "relateddecisions" || lower === "manifestdecisions") {
      summaryLines.push({ label: "Related decisions", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "referenced" || lower === "findingref" || lower === "primaryrisk") {
      const friendly = KNOWN_REFERENCE_SLUGS[value] ?? titleCaseSlug(value);

      summaryLines.push({ label: "Risk area", value: friendly });
      technicalLines.push({ label: `Raw reference (${key})`, value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "severity" || lower.endsWith("severity")) {
      summaryLines.push({ label: "Severity", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "rationale" || lower === "summary") {
      summaryLines.push({ label: "Rationale", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "impact" || lower === "decisionimpact") {
      summaryLines.push({ label: "Decision impact", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "nextaction" || lower === "nextsteps") {
      summaryLines.push({ label: "Next action", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (
      lower === "blockingstatus" ||
      lower === "blocking_status" ||
      lower === "isblocking" ||
      lower === "blocking"
    ) {
      summaryLines.push({ label: "Blocking status", value: value.length > 0 ? value : "—" });

      continue;
    }

    if (lower === "monitoringcadence" || lower === "monitoring_cadence") {
      summaryLines.push({ label: "Monitoring cadence", value: value.length > 0 ? value : "—" });

      continue;
    }

    technicalLines.push({ label: key, value: value.length > 0 ? value : "—" });
  }

  const inferredPhiFinding =
    (metadata.referenceId ?? metadata.ReferenceId ?? "").trim() === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID ||
    (metadata.referenced ?? "").trim() === "phi-minimization-risk";

  if (inferredPhiFinding) {
    const summaryLabelsPresent = new Set(summaryLines.map((row) => row.label));

    const attachStructuredField = (label: string, value: string): void => {
      if (!summaryLabelsPresent.has(label)) {
        summaryLines.push({ label, value });
        summaryLabelsPresent.add(label);
      }
    };

    attachStructuredField("Severity", "High");
    attachStructuredField("Disposition", "Accepted with monitoring");
    attachStructuredField("Blocking status", "Non-blocking");
    attachStructuredField(
      "Monitoring cadence",
      "Ongoing intake monitoring aligned to governance checkpoints",
    );
  }

  return { summaryLines, technicalLines };
}
