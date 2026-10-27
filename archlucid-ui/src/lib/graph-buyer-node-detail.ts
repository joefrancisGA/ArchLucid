import { isBuyerTrailPhiHeroNode } from "@/lib/graph-mapper";
import {
  listRegisteredSampleScenarios,
  resolveSampleScenarioByHeroFindingId,
} from "@/lib/samples/registry";
import type { GraphNodeVm } from "@/types/graph";

export type BuyerTrailMetadataLine = {
  readonly label: string;
  readonly value: string;
};

function resolveHeroFindingReferenceScenario(
  referenceId: string,
  referencedSlug: string,
): ReturnType<typeof resolveSampleScenarioByHeroFindingId> {
  const directScenario =
    resolveSampleScenarioByHeroFindingId(referenceId.trim())
    ?? resolveSampleScenarioByHeroFindingId(referencedSlug.trim());
  const normalizedReferenceId = referenceId.trim().toLowerCase();
  const normalizedReferencedSlug = referencedSlug.trim().toLowerCase();

  if (directScenario !== null) {
    return directScenario;
  }

  return listRegisteredSampleScenarios().find(
    (scenario) => {
      const normalizedPrimaryFindingId = scenario.primaryFindingId.trim().toLowerCase();

      return normalizedPrimaryFindingId === normalizedReferenceId
        || normalizedPrimaryFindingId === normalizedReferencedSlug;
    },
  ) ?? null;
}

function metadataValue(metadata: Record<string, string>, name: string): string {
  const normalizedName = name.toLowerCase();
  const entry = Object.entries(metadata).find(([key]) => key.trim().toLowerCase() === normalizedName);

  return entry === undefined ? "" : String(entry[1]).trim();
}

/**
 * Buyer-trail panel: one-line disposition when inferable from metadata (showcase hero finding or explicit disposition keys).
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

  const referenceId = metadataValue(metadata, "referenceId");
  const referencedSlug = metadataValue(metadata, "referenced");
  const scenario = resolveHeroFindingReferenceScenario(referenceId, referencedSlug);

  if (scenario !== null) {
    return "Disposition was not stored on this showcase finding — open the linked finding for the recorded resolve decision.";
  }

  return "Disposition was not stored.";
}

/** Buyer trail panel heading tied to the selected graph node. */
function resolveBuyerTrailHeadingLabel(node: GraphNodeVm, notStoredLabel: string): string {
  const trimmed = node.label?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : notStoredLabel;
}

export function graphBuyerTrailPanelTitle(node: GraphNodeVm): string {
  const recordType = graphBuyerTrailRecordTypeLine(node);

  if (node.type === "Finding") {
    const label = resolveBuyerTrailHeadingLabel(node, "Finding title was not stored.");

    return `Selected finding: ${label}`;
  }

  if (node.type === "Decision") {
    const label = resolveBuyerTrailHeadingLabel(node, "Decision title was not stored.");

    return `Selected decision: ${label}`;
  }

  if (node.type === "GoldenManifest") {
    const label = resolveBuyerTrailHeadingLabel(node, "Review name was not stored.");

    return `Selected review: ${label}`;
  }

  if (node.type === "Artifact") {
    const label = resolveBuyerTrailHeadingLabel(node, "Evidence name was not stored.");

    return `Selected evidence: ${label}`;
  }

  if (node.type === "TopologyResource") {
    const label = resolveBuyerTrailHeadingLabel(node, "Resource name was not stored.");

    return `Selected inventory resource: ${label}`;
  }

  const label = node.label.trim().length > 0 ? node.label.trim() : recordType.primary;

  return `Selected ${recordType.primary.toLowerCase()}: ${label}`;
}

/** Buyer trail panel: human record type line (Finding vs risk finding vs other node types). */
export function graphBuyerTrailRecordTypeLine(node: GraphNodeVm): {
  readonly primary: string;
  readonly secondary: BuyerTrailMetadataLine | null;
} {
  if (node.type === "Finding" || isBuyerTrailPhiHeroNode(node)) {
    const storedLabel = node.label?.trim() ?? "";

    return {
      primary: storedLabel.length > 0 ? `Finding: ${storedLabel}` : "Finding title was not stored.",
      secondary: isBuyerTrailPhiHeroNode(node)
        ? {
            label: "Risk area",
            value: resolveSampleHeroRiskAreaValue(node.metadata),
          }
        : null,
    };
  }

  if (node.type === "TopologyResource") {
    return { primary: "Inventory resource", secondary: null };
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
      technicalLines.push({
        label: "Reference ID",
        value: value.length > 0 ? value : "Reference ID was stored empty.",
      });

      continue;
    }

    if (
      lower === "resourceid"
      || lower === "armresourceid"
      || lower === "azureresourceid"
      || lower === "awsresourceid"
      || lower === "gcpresourceid"
    ) {
      summaryLines.push({
        label: "Cloud resource ID",
        value: value.length > 0 ? value : "Cloud resource ID was not stored.",
      });

      continue;
    }

    if (lower === "resourcetype" || lower === "armresourcetype") {
      summaryLines.push({
        label: "Resource type",
        value: value.length > 0 ? value : "Resource type was not stored.",
      });

      continue;
    }

    if (lower === "riskarea" || lower === "risk_domain" || lower === "riskdomain") {
      summaryLines.push({
        label: "Risk area",
        value: value.length > 0 ? value : "Risk area was stored empty.",
      });

      continue;
    }

    if (
      lower === "whyitmatters" ||
      lower === "whymatters" ||
      lower === "businessmeaning" ||
      lower === "sponsorimpact"
    ) {
      summaryLines.push({ label: "Why it matters", value: value.length > 0 ? value : "Why it matters was not stored." });

      continue;
    }

    if (lower === "evidence" || lower === "citations" || lower === "evidencecitations") {
      summaryLines.push({ label: "Evidence citations", value: value.length > 0 ? value : "Evidence citations were not stored." });

      continue;
    }

    if (lower === "mitigation" || lower === "remediation") {
      summaryLines.push({ label: "Mitigation", value: value.length > 0 ? value : "Mitigation was not stored." });

      continue;
    }

    if (lower === "relateddecisions" || lower === "manifestdecisions") {
      summaryLines.push({ label: "Related decisions", value: value.length > 0 ? value : "Related decisions were not stored." });

      continue;
    }

    if (lower === "referenced" || lower === "findingref" || lower === "primaryrisk") {
      technicalLines.push({ label: `Raw reference (${key})`, value });

      continue;
    }

    if (lower === "severity" || lower.endsWith("severity")) {
      summaryLines.push({ label: "Severity", value: value.length > 0 ? value : "Severity was not stored." });

      continue;
    }

    if (lower === "rationale" || lower === "summary") {
      summaryLines.push({ label: "Rationale", value: value.length > 0 ? value : "Rationale was not stored." });

      continue;
    }

    if (lower === "impact" || lower === "decisionimpact") {
      summaryLines.push({
        label: "Decision impact",
        value: value.length > 0 ? value : "Decision impact was not stored.",
      });

      continue;
    }

    if (lower === "nextaction" || lower === "nextsteps") {
      summaryLines.push({
        label: "Next action",
        value: value.length > 0 ? value : "Next action was not stored.",
      });

      continue;
    }

    if (
      lower === "blockingstatus" ||
      lower === "blocking_status" ||
      lower === "isblocking" ||
      lower === "blocking"
    ) {
      summaryLines.push({
        label: "Blocking status",
        value: value.length > 0 ? value : "Blocking status was not stored.",
      });

      continue;
    }

    if (lower === "monitoringcadence" || lower === "monitoring_cadence") {
      summaryLines.push({
        label: "Monitoring cadence",
        value: value.length > 0 ? value : "Monitoring cadence was not stored.",
      });

      continue;
    }

    if (lower === "roledefinition" || lower === "rolename" || lower === "assignedrole") {
      summaryLines.push({
        label: "Role assignment",
        value: value.length > 0 ? value : "Role name was not stored.",
      });

      continue;
    }

    if (lower === "principalid" || lower === "identityobjectid") {
      summaryLines.push({
        label: "Principal",
        value: value.length > 0 ? value : "Principal id was not stored.",
      });

      continue;
    }

    technicalLines.push({ label: key, value });
  }

  return { summaryLines, technicalLines };
}

/** OpenAPI marks GraphNodeVm.metadata nullable; treat null like a missing map. */
function resolveSampleHeroRiskAreaValue(metadata: GraphNodeVm["metadata"]): string {
  if (metadata == null) {
    return "Risk area was not stored.";
  }

  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    const key = rawKey.trim().toLowerCase();

    if (key === "riskarea" || key === "risk_domain" || key === "riskdomain") {
      const trimmed = String(rawValue).trim();

      return trimmed.length > 0 ? trimmed : "Risk area was stored empty.";
    }
  }

  return "Risk area was not stored.";
}

function isInternalGraphReferenceTechnicalLine(line: BuyerTrailMetadataLine): boolean {
  const label = line.label.trim();

  if (label === "Reference ID") {
    return true;
  }

  if (label.startsWith("Raw reference (")) {
    return true;
  }

  return false;
}

/**
 * Buyer-trail panel: only surface the technical appendix when it adds fields beyond internal graph linkage ids.
 * A lone Reference ID or raw slug duplicates what At a glance already synthesizes for showcase findings.
 */
export function visibleBuyerTrailTechnicalAppendixLines(
  technicalLines: readonly BuyerTrailMetadataLine[],
): BuyerTrailMetadataLine[] {
  return technicalLines.filter((line) => !isInternalGraphReferenceTechnicalLine(line));
}
