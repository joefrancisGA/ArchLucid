import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

/** Normalizes API node `type` strings (camelCase, PascalCase, punctuation) to a lookup key. */
export function normalizeProvenanceNodeTypeKey(nodeType: string): string {
  return nodeType.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

const PROVENANCE_NODE_TYPE_LABEL_BY_KEY: Readonly<Record<string, string>> = {
  architecturerun: "Review kickoff",
  request: "Review request",
  run: "Review started",
  review: "Review",
  contextsnapshot: "Reviewed source context",
  graphsnapshot: BUYER_SURFACE_VOCABULARY.evidenceGraph,
  findingssnapshot: "Findings recorded",
  finding: "Finding",
  goldenmanifest: SIGNED_MANIFEST_LABEL,
  goldenmanifestpointer: SIGNED_MANIFEST_LABEL,
  manifestversion: SIGNED_MANIFEST_LABEL,
  manifest: SIGNED_MANIFEST_LABEL,
  artifactbundle: "Deliverables packaged",
  evidencebundle: "Evidence bundle",
  evidenceartifact: "Evidence source",
  artifact: "Artifact",
  policypack: "Policy pack",
  decisionrule: "Decision rule",
  decisiontrace: "Decision",
  decisionnode: "Decision",
  decision: "Decision",
  control: "Control / mitigation",
  mitigation: "Mitigation",
  auditevent: "Audit trail event",
  governance: "Governance record",
  traceevent: "Trace event",
  reviewer: "Reviewer",
  riskowner: "Risk owner",
  monitor: "Monitoring record",
  agenttask: "Agent task",
  agentresult: "Agent result",
};

const RAW_HEX_ID_RE = /^[0-9a-f]{32}$/i;
const TYPE_PLUS_HEX_ID_RE = /^(\S+)\s+([0-9a-f]{32})$/i;

function humanizeUnknownProvenanceNodeType(nodeType: string): string {
  const spaced = nodeType
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  if (spaced.length === 0) {
    return "Provenance item";
  }

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Buyer-facing label for a provenance graph node `type` (tables, graph aria, chips). */
export function provenanceNodeTypeBuyerLabel(nodeType: string): string {
  const key = normalizeProvenanceNodeTypeKey(nodeType);
  const mapped = PROVENANCE_NODE_TYPE_LABEL_BY_KEY[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return humanizeUnknownProvenanceNodeType(nodeType);
}

function isInternalProvenanceNodeName(name: string, nodeType: string): boolean {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed === "ArchLucid") {
    return true;
  }

  if (RAW_HEX_ID_RE.test(trimmed)) {
    return true;
  }

  const typePlusId = TYPE_PLUS_HEX_ID_RE.exec(trimmed);

  if (typePlusId !== null) {
    const prefix = typePlusId[1].toLowerCase();
    const normalizedType = normalizeProvenanceNodeTypeKey(nodeType);

    if (prefix === normalizedType || prefix === "run" || prefix === "review") {
      return true;
    }
  }

  return false;
}

/** Primary display label for a provenance node when a persisted `name` is present. */
export function provenanceNodeNameBuyerLabel(nodeType: string, fallbackName: string): string {
  const mappedTypeLabel = provenanceNodeTypeBuyerLabel(nodeType);
  const trimmedName = fallbackName.trim();

  if (trimmedName.length === 0 || isInternalProvenanceNodeName(trimmedName, nodeType)) {
    return mappedTypeLabel;
  }

  return trimmedName;
}
