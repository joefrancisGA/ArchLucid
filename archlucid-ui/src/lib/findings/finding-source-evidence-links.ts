import {
  diagramEvidenceCitationLabel,
  tryParseDiagramEvidenceCitation,
  type DiagramEvidenceCitation,
} from "@/lib/findings/diagram-evidence-citation";
import { graphEvidenceHrefFromInspect, preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";
import { findingInspectEvidenceCitationLabel } from "@/lib/findings/finding-policy-evidence-citations";
import { normalizeEvidenceRefSnippet } from "@/lib/findings/finding-evidence-ref-snippet";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import type { FindingInspectEvidence, FindingInspectPayload } from "@/types/finding-inspect";
import { signedRecordSectionPath } from "@/lib/signed-records-paths";

export type FindingSourceEvidenceLinkKind =
  | "manifestSection"
  | "manifestRecord"
  | "graphNode"
  | "artifactSection"
  | "diagramShape"
  | "inspect";

/** Navigable evidence anchor derived from inspect rows or persisted evidence refs. */
export type FindingSourceEvidenceLink = {
  readonly kind: FindingSourceEvidenceLinkKind;
  readonly label: string;
  readonly detail: string | null;
  readonly href: string;
  readonly diagramCitation?: DiagramEvidenceCitation | null;
};

export type FindingSourceEvidenceLinkContext = {
  readonly runId: string;
  readonly findingId: string;
  readonly manifestId?: string | null;
  /** When true, manifest links may say finalized; otherwise use review-record wording. */
  readonly reviewManifestFinalized?: boolean | null;
};

const UNRESOLVED_EVIDENCE_REF_LABEL = "This evidence reference did not resolve to a stored artifact." as const;

function manifestRecordSectionLinkLabel(ctx: FindingSourceEvidenceLinkContext): string {
  return ctx.reviewManifestFinalized === true
    ? "Open finalized record section"
    : "Open review record section.";
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function encodeRunPath(runId: string): string {
  return encodeURIComponent(runId.trim());
}

/** In-app run detail section anchor (`#manifest-summary`, `#artifacts-exports`, …). */
export function runDetailSectionHref(runId: string, sectionId: string): string {
  return `/architecture/reviews/${encodeRunPath(runId)}#${sectionId.trim()}`;
}

/** Manifest record page section anchor (`#manifest-decisions`, …). */
export function manifestRecordSectionHref(manifestId: string, sectionId: string): string {
  return signedRecordSectionPath(manifestId, sectionId);
}

function detailFromInspectRow(row: FindingInspectEvidence): string | null {
  const parts: string[] = [];
  const lineRange = nonEmpty(row.lineRange);

  if (lineRange !== null) {
    parts.push(`Lines ${lineRange}`);
  }

  const artifactId = nonEmpty(row.artifactId);

  if (artifactId !== null) {
    parts.push(artifactId);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function linkFromKind(
  kind: FindingSourceEvidenceLinkKind,
  label: string,
  href: string,
  detail: string | null,
  diagramCitation: DiagramEvidenceCitation | null = null,
): FindingSourceEvidenceLink {
  return { kind, label, href, detail, diagramCitation };
}

function resolveDiagramCitationFromInspectRow(
  row: FindingInspectEvidence,
): DiagramEvidenceCitation | null {
  const artifactCitation = tryParseDiagramEvidenceCitation(row.artifactId);

  if (artifactCitation !== null) {
    return artifactCitation;
  }

  return tryParseDiagramEvidenceCitation(row.excerpt);
}

function parsePrefixedRef(ref: string): { prefix: string; target: string } | null {
  const normalized = ref.trim();

  if (normalized.length === 0) {
    return null;
  }

  const colon = normalized.indexOf(":");

  if (colon <= 0) {
    return null;
  }

  return {
    prefix: normalized.slice(0, colon).toLowerCase(),
    target: normalized.slice(colon + 1).trim(),
  };
}

function showcaseInspectEvidenceLink(
  ctx: FindingSourceEvidenceLinkContext,
  row: FindingInspectEvidence,
  index: number,
): FindingSourceEvidenceLink | null {
  const graphFocusId = preferredGraphNodeIdForFindingDeepLink(ctx.runId, ctx.findingId);

  if (graphFocusId === null) {
    return null;
  }

  const detail = detailFromInspectRow(row);
  if (index === 0) {
    return linkFromKind(
      "manifestSection",
      "Open PHI handling in finalized review record",
      runDetailSectionHref(ctx.runId, "manifest-summary"),
      detail,
    );
  }

  if (row.artifactId === null || row.artifactId === undefined) {
    return linkFromKind(
      "graphNode",
      "Evidence artifact id was not stored.",
      graphTrailHrefWithOptionalNode(ctx.runId, graphFocusId),
      detail,
    );
  }

  const artifactLabel = nonEmpty(row.artifactId)?.replace(/-/g, " ") ?? "cited evidence";

  return linkFromKind(
    "graphNode",
    evidenceTrailLinkLabelForArtifactId(row.artifactId ?? ""),
    graphTrailHrefWithOptionalNode(ctx.runId, graphFocusId),
    detail,
  );
}

const EVIDENCE_TRAIL_ARTIFACT_NAME_OMISSION_LINK = "Artifact name was not stored. Open the evidence trail." as const;

function evidenceTrailLinkLabelForArtifactId(_artifactId: string): string {
  return EVIDENCE_TRAIL_ARTIFACT_NAME_OMISSION_LINK;
}

function inspectRowSourceLink(
  ctx: FindingSourceEvidenceLinkContext,
  row: FindingInspectEvidence,
  index: number,
): FindingSourceEvidenceLink {
  const showcaseLink = showcaseInspectEvidenceLink(ctx, row, index);

  if (showcaseLink !== null) {
    return showcaseLink;
  }

  const artifactId = nonEmpty(row.artifactId);
  const detail = detailFromInspectRow(row);
  const label = findingInspectEvidenceCitationLabel(row);
  const diagramCitation = resolveDiagramCitationFromInspectRow(row);

  if (diagramCitation !== null) {
    return linkFromKind(
      "diagramShape",
      diagramEvidenceCitationLabel(diagramCitation),
      "#diagram-citation-preview",
      detail ?? diagramCitation.shapeOrEdgeId,
      diagramCitation,
    );
  }

  if (artifactId !== null) {
    const prefixed = parsePrefixedRef(artifactId);

    if (prefixed?.prefix === "manifest" || prefixed?.prefix === "decision") {
      const manifestId = nonEmpty(ctx.manifestId) ?? nonEmpty(prefixed.target);

      if (manifestId !== null && manifestId.includes("-")) {
        return linkFromKind(
          "manifestRecord",
          manifestRecordSectionLinkLabel(ctx),
          manifestRecordSectionHref(manifestId, "manifest-decisions"),
          detail,
        );
      }

      return linkFromKind(
        "manifestSection",
        manifestRecordSectionLinkLabel(ctx),
        runDetailSectionHref(ctx.runId, "manifest-summary"),
        detail,
      );
    }

    if (prefixed?.prefix === "graph") {
      return linkFromKind(
        "graphNode",
        "Open graph evidence",
        graphTrailHrefWithOptionalNode(ctx.runId, prefixed.target),
        detail,
      );
    }

    const graphFocusId = preferredGraphNodeIdForFindingDeepLink(ctx.runId, ctx.findingId);

    if (graphFocusId !== null) {
      return linkFromKind(
        "graphNode",
        evidenceTrailLinkLabelForArtifactId(artifactId),
        graphTrailHrefWithOptionalNode(ctx.runId, graphFocusId),
        detail,
      );
    }

    return linkFromKind(
      "artifactSection",
      evidenceTrailLinkLabelForArtifactId(artifactId),
      runDetailSectionHref(ctx.runId, "artifacts-exports"),
      detail,
    );
  }

  const graphHref = graphEvidenceHrefFromInspect(ctx.runId, ctx.findingId, {
    findingId: ctx.findingId,
    typedPayload: null,
    decisionRuleId: null,
    decisionRuleName: null,
    evidence: [row],
    recommendedActions: [],
    auditRowId: null,
    runId: ctx.runId,
    manifestVersion: null,
  });

  if (graphHref !== null) {
    return linkFromKind("graphNode", label, graphHref, detail);
  }

  return linkFromKind(
    "artifactSection",
    UNRESOLVED_EVIDENCE_REF_LABEL,
    "",
    detail,
  );
}

/** Maps one persisted evidence ref token to a navigable in-app anchor. */
export function parseEvidenceRefToSourceLink(
  ref: string,
  ctx: FindingSourceEvidenceLinkContext,
): FindingSourceEvidenceLink | null {
  const snippet = normalizeEvidenceRefSnippet(ref);

  if (snippet === null) {
    return null;
  }

  const diagramCitation = tryParseDiagramEvidenceCitation(snippet);

  if (diagramCitation !== null) {
    return linkFromKind(
      "diagramShape",
      diagramEvidenceCitationLabel(diagramCitation),
      "#diagram-citation-preview",
      snippet,
      diagramCitation,
    );
  }

  const prefixed = parsePrefixedRef(snippet);
  const lower = snippet.toLowerCase();

  if (prefixed?.prefix === "manifest" || prefixed?.prefix === "decision" || lower.includes("manifest")) {
    const manifestId = nonEmpty(ctx.manifestId);

    if (manifestId !== null) {
      return linkFromKind(
        "manifestRecord",
        manifestRecordSectionLinkLabel(ctx),
        manifestRecordSectionHref(manifestId, "manifest-decisions"),
        snippet,
      );
    }

    return linkFromKind(
      "manifestSection",
      manifestRecordSectionLinkLabel(ctx),
      runDetailSectionHref(ctx.runId, "manifest-summary"),
      snippet,
    );
  }

  if (prefixed?.prefix === "graph") {
    return linkFromKind(
      "graphNode",
      "Open evidence trail",
      graphTrailHrefWithOptionalNode(ctx.runId, prefixed.target),
      snippet,
    );
  }

  if (prefixed?.prefix === "artifact") {
    return linkFromKind(
      "artifactSection",
      "Open artifact",
      runDetailSectionHref(ctx.runId, "artifacts-exports"),
      snippet,
    );
  }

  const graphFocusId = preferredGraphNodeIdForFindingDeepLink(ctx.runId, ctx.findingId);

  if (graphFocusId !== null) {
    return linkFromKind(
      "graphNode",
      "Open evidence trail",
      graphTrailHrefWithOptionalNode(ctx.runId, graphFocusId),
      snippet,
    );
  }

  return linkFromKind(
    "artifactSection",
    UNRESOLVED_EVIDENCE_REF_LABEL,
    "",
    snippet,
  );
}

export function buildSourceEvidenceLinksFromInspectEvidence(
  ctx: FindingSourceEvidenceLinkContext,
  row: FindingInspectEvidence,
  index: number,
): FindingSourceEvidenceLink {
  return inspectRowSourceLink(ctx, row, index);
}

export function buildSourceEvidenceLinksFromInspect(
  ctx: FindingSourceEvidenceLinkContext,
  payload: FindingInspectPayload,
): FindingSourceEvidenceLink[] {
  return payload.evidence.map((row, index) => buildSourceEvidenceLinksFromInspectEvidence(ctx, row, index));
}

export function buildSourceEvidenceLinksFromEvidenceRefs(
  ctx: FindingSourceEvidenceLinkContext,
  refs: readonly string[],
): FindingSourceEvidenceLink[] {
  const links: FindingSourceEvidenceLink[] = [];

  for (const ref of refs) {
    const link = parseEvidenceRefToSourceLink(ref, ctx);

    if (link !== null) {
      links.push(link);
    }
  }

  return links;
}

/** Preferred navigation target for findings-table chips (manifest section first when present). */
export function primaryFindingEvidenceNavigationHref(
  links: readonly FindingSourceEvidenceLink[],
): string | null {
  if (links.length === 0) {
    return null;
  }

  const manifestLink = links.find((link) => link.kind === "manifestSection" || link.kind === "manifestRecord");

  if (manifestLink !== undefined) {
    return manifestLink.href;
  }

  return links[0]?.href ?? null;
}

export function linksIncludeManifestSection(links: readonly FindingSourceEvidenceLink[]): boolean {
  return links.some((link) => link.kind === "manifestSection" || link.kind === "manifestRecord");
}

/** @deprecated Callers must pass an explicit manifest id from the run record — no showcase backfill. */
export function defaultManifestIdForShowcaseFinding(_runId: string, _findingId: string): string | null {
  return null;
}
