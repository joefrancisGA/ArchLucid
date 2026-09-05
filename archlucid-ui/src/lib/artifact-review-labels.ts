/**
 * Operator-facing copy for synthesized artifact types (ArchLucid.ArtifactSynthesis.Models.ArtifactType).
 */
import {
  SPONSOR_BRIEFING_LABEL,
} from "@/lib/usability/canonical-product-terms";

const ARTIFACT_TYPE_COPY: Record<string, { label: string; description: string }> = {
  ReferenceArchitectureMarkdown: {
    label: "Reference architecture (Markdown)",
    description:
      "Narrative reference architecture derived from the sealed review recor — uitable for review and handoff as documentation.",
  },
  ArchitectureNarrative: {
    label: "Architecture narrative",
    description:
      "Structured narrative summary of the architecture decisions and context captured in the review record.",
  },
  DiagramAst: {
    label: "Diagram AST (JSON)",
    description:
      "Machine-oriented graph of nodes and edges representing review-record-linked elements; used for rendering or tooling.",
  },
  MermaidDiagram: {
    label: "Mermaid diagram",
    description:
      "Mermaid source for a high-level diagram (often decisions linked to the review record). Render in a Mermaid-capable viewer or download the file.",
  },
  Inventory: {
    label: "Inventory",
    description:
      "JSON inventory of resources or components inferred from the architecture context for this review.",
  },
  CostSummary: {
    label: "Cost summary",
    description:
      "JSON summary of cost signals associated with the architecture (where modeled in the review pipeline).",
  },
  ComplianceMatrix: {
    label: "Compliance matrix",
    description:
      "JSON matrix of compliance-related controls or requirements versus the current review record posture.",
  },
  CoverageSummary: {
    label: "Coverage summary",
    description:
      "JSON summary of coverage dimensions (e.g. requirements or controls) for the finalized review record.",
  },
  UnresolvedIssuesReport: {
    label: "Unresolved issues",
    description:
      "JSON report listing unresolved issues or warnings that architects should triage before sign-off.",
  },
  JsonBundle: {
    label: "Architecture decision record",
    description:
      "Structured decisions bundle linked to the sealed review record — open in a JSON viewer or download.",
  },
  MarkdownReport: {
    label: "Markdown report",
    description:
      "Human-readable Markdown artifact derived from the finalized review or synthesis pipeline.",
  },
  Diagram: {
    label: "Diagram",
    description:
      "Diagram source (for example Mermaid) for a context or architecture view tied to this review.",
  },
};

/**
 * Maps raw format strings (API values like "markdown", "json") to a short business label
 * suitable for a sponsor-facing artifact table. Avoids surfacing MIME types or raw identifiers.
 */
export function getArtifactFormatLabel(format: string): string {
  const normalized = format.trim().toLowerCase();

  return (
    {
      markdown: "Markdown",
      md: "Markdown",
      json: "JSON",
      mermaid: "Diagram source",
      mmd: "Diagram source",
      plain: "Plain text",
      txt: "Plain text",
      csv: "CSV",
      pdf: "PDF",
      "text/markdown": "Markdown",
      "text/plain": "Plain text",
      "application/json": "JSON",
      "text/csv": "CSV",
      "application/pdf": "PDF",
      "text/mermaid": "Diagram source",
    }[normalized] ??
    (normalized.includes("/") ? "Document" : format)
  );
}

/** Returns a human-readable label for an artifact type (e.g. "Cost summary" for "CostSummary"). */
export function getArtifactTypeLabel(artifactType: string): string {
  const entry = ARTIFACT_TYPE_COPY[artifactType];

  if (entry) {
    return entry.label;
  }

  return artifactType.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

/**
 * Buyer-facing business label for artifact types used on public/marketing pages.
 * Maps technical artifact types to sponsor-readable names.
 */
const ARTIFACT_BUSINESS_LABELS: Record<string, string> = {
  MarkdownReport: SPONSOR_BRIEFING_LABEL,
  JsonBundle: "Architecture decision record",
  Diagram: "Intake context diagram",
  MermaidDiagram: "Intake context diagram",
  DiagramAst: "Intake context diagram",
  EvidenceBundle: "Evidence bundle",
  CostSummary: "Cost analysis",
  UnresolvedIssuesReport: "Residual risk summary",
  ArchitectureNarrative: "Architecture narrative",
  Inventory: "Architecture inventory",
};

/** Friendly titles for curated demo artifact ids (buyer tables hide raw slugs). */
const ARTIFACT_ID_BUSINESS_LABELS: Record<string, string> = {
  "intake-subgraph-v2": "Intake data-flow subgraph",
  "ingress-classifier-spec": "Ingress PHI classifier specification",
  "ocr-bypass-monitor": "OCR bypass monitoring control",
  "architecture-review-board": "Architecture review board pack",
};

export function getArtifactBusinessLabel(artifactType: string): string {
  return ARTIFACT_BUSINESS_LABELS[artifactType] ?? getArtifactTypeLabel(artifactType);
}

/** Resolves a buyer-facing artifact title from id first, then synthesized type. */
export function getArtifactDisplayLabel(input: {
  readonly artifactId?: string | null;
  readonly artifactType: string;
}): string {
  const slug = (input.artifactId ?? "").trim();

  if (slug.length > 0) {
    const byId = ARTIFACT_ID_BUSINESS_LABELS[slug];

    if (byId !== undefined) {
      return byId;
    }
  }

  return getArtifactBusinessLabel(input.artifactType);
}

/** Removes a trailing filename extension for sponsor-facing captions (keeps interior dots). */
export function stripArtifactFilenameExtension(filename: string): string {
  return filename.replace(/\.[^./\\]+$/u, "").trim();
}

/** Maps common synthesized artifact filename stems to sponsor-facing labels (no file extensions). */
const SPONSOR_FILENAME_STEM_LABELS: Record<string, string> = {
  SPONSOR_SPONSOR_BRIEF: "Sponsor sponsor brief",
  PILOT_ROI_MODEL: "Pilot ROI model",
  FIRST_VALUE_REPORT: "First value report",
  BOARD_PACK: "Board pack",
  PROCUREMENT_PACK: "Procurement pack",
};

/**
 * Optional second line under the business label in sponsor artifact tables.
 * Omits redundant filenames when the stem matches or extends the curated label.
 */
export function sponsorArtifactSecondaryCaption(filename: string, businessLabel: string): string | null {
  const stripped = stripArtifactFilenameExtension(filename).trim();

  if (stripped.length === 0) {
    return null;
  }

  const stem = stripped.toLowerCase();
  const label = businessLabel.trim().toLowerCase();

  const stemNormalized = stripped.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  const mapped = SPONSOR_FILENAME_STEM_LABELS[stemNormalized];

  if (mapped !== undefined && mapped.trim().toLowerCase() !== label) {
    return mapped;
  }

  if (stem === label) {
    return null;
  }

  if (stem.startsWith(label) || label.startsWith(stem)) {
    return null;
  }

  // An uncapitalized stem (e.g. "cost summary", "unresolved-issues") is a build-time filename, not a
  // human-authored title. Sponsor deliverables must not surface raw slugs — UI_DESIGN_SYSTEM.md
  // § Technical details.
  if (!/[A-Z]/.test(stripped)) {
    return null;
  }

  return stripped;
}

/** Returns a one-line description of what an artifact type represents, for the preview panel header. */
export function getArtifactTypeDescription(artifactType: string): string {
  const entry = ARTIFACT_TYPE_COPY[artifactType];

  if (entry) {
    return entry.description;
  }

  return `Synthesized artifact of type "${artifactType}". Use metadata and content below to orient; download if you need an offline copy.`;
}
