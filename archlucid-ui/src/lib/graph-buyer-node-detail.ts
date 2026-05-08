import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";

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
  "phi-minimization-risk": "PHI Minimization Risk",
};

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

    if (lower === "referenced" || lower === "findingref" || lower === "primaryrisk") {
      const friendly = KNOWN_REFERENCE_SLUGS[value] ?? titleCaseSlug(value);

      summaryLines.push({ label: "Primary risk", value: friendly });
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

    technicalLines.push({ label: key, value: value.length > 0 ? value : "—" });
  }

  return { summaryLines, technicalLines };
}
