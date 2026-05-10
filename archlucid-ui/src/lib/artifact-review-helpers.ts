/**
 * Operator-facing copy for synthesized artifact types (ArchLucid.ArtifactSynthesis.Models.ArtifactType).
 */
const ARTIFACT_TYPE_COPY: Record<string, { label: string; description: string }> = {
  ReferenceArchitectureMarkdown: {
    label: "Reference architecture (Markdown)",
    description:
      "Narrative reference architecture derived from the reviewed manifest—suitable for review and handoff as documentation.",
  },
  ArchitectureNarrative: {
    label: "Architecture narrative",
    description:
      "Structured narrative summary of the architecture decisions and context captured in the manifest.",
  },
  DiagramAst: {
    label: "Diagram AST (JSON)",
    description:
      "Machine-oriented graph of nodes and edges representing manifest-linked elements; used for rendering or tooling.",
  },
  MermaidDiagram: {
    label: "Mermaid diagram",
    description:
      "Mermaid source for a high-level diagram (often decisions linked to the manifest). Render in a Mermaid-capable viewer or download the file.",
  },
  Inventory: {
    label: "Inventory",
    description:
      "JSON inventory of resources or components inferred from the architecture context for this review.",
  },
  CostSummary: {
    label: "Cost summary",
    description:
      "JSON summary of cost signals associated with the architecture (where modeled in the manifest pipeline).",
  },
  ComplianceMatrix: {
    label: "Compliance matrix",
    description:
      "JSON matrix of compliance-related controls or requirements versus the current manifest posture.",
  },
  CoverageSummary: {
    label: "Coverage summary",
    description:
      "JSON summary of coverage dimensions (e.g. requirements or controls) for the finalized manifest.",
  },
  UnresolvedIssuesReport: {
    label: "Unresolved issues",
    description:
      "JSON report listing unresolved issues or warnings that operators should triage before sign-off.",
  },
  JsonBundle: {
    label: "Architecture decision record",
    description:
      "Structured decisions bundle linked to the manifest — open in a JSON viewer or download.",
  },
  MarkdownReport: {
    label: "Markdown report",
    description:
      "Human-readable Markdown artifact derived from the reviewed manifest or synthesis pipeline.",
  },
  Diagram: {
    label: "Diagram",
    description:
      "Diagram source (for example Mermaid) for a context or architecture view tied to this review.",
  },
};

export type ArtifactViewKind = "markdown" | "json" | "mermaid" | "plain";

/**
 * Maps API format + type to how the shell should present body text (no markdown renderer dependency).
 */
export function classifyArtifactView(format: string, artifactType: string): ArtifactViewKind {
  const f = format.trim().toLowerCase();

  if (f === "markdown" || f === "md") {
    return "markdown";
  }

  if (f === "mermaid" || f === "mmd") {
    return "mermaid";
  }

  if (f === "json" || artifactType === "DiagramAst") {
    return "json";
  }

  return "plain";
}

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
  MarkdownReport: "Sponsor briefing",
  JsonBundle: "Architecture decision record",
  Diagram: "Intake context diagram",
  MermaidDiagram: "Intake context diagram",
  DiagramAst: "Intake context diagram",
  EvidenceBundle: "Evidence bundle",
  CostSummary: "Cost analysis",
  UnresolvedIssuesReport: "Open issues summary",
  ArchitectureNarrative: "Architecture narrative",
  Inventory: "Architecture inventory",
};

export function getArtifactBusinessLabel(artifactType: string): string {
  return ARTIFACT_BUSINESS_LABELS[artifactType] ?? getArtifactTypeLabel(artifactType);
}

/** Removes a trailing filename extension for sponsor-facing captions (keeps interior dots). */
export function stripArtifactFilenameExtension(filename: string): string {
  return filename.replace(/\.[^./\\]+$/u, "").trim();
}

/** Maps common synthesized artifact filename stems to sponsor-facing labels (no file extensions). */
const SPONSOR_FILENAME_STEM_LABELS: Record<string, string> = {
  EXECUTIVE_SPONSOR_BRIEF: "Executive sponsor brief",
  PILOT_ROI_MODEL: "Pilot ROI model",
  FIRST_VALUE_REPORT: "First value report",
  BOARD_PACK: "Board pack",
  PROCUREMENT_PACK: "Procurement pack",
};

/**
 * One-line audience hint for sponsor-mode tables (who uses the file and why).
 * Returns null when the artifact type is unknown to keep the table scannable.
 */
export function sponsorArtifactAudienceLine(artifactType: string): string | null {
  const normalizedType = artifactType.trim();

  const lineByType: Record<string, string> = {
    MarkdownReport: "Used by sponsor — executive readout and sign-off context.",
    ArchitectureNarrative: "Used by sponsor — plain-language summary for stakeholders.",
    JsonBundle: "Used by architects — decision record, traceability, and handoffs.",
    DiagramAst: "Used by architects — machine-readable structure for diagrams and tooling.",
    MermaidDiagram:
      "Used by architects — diagram source reviewers can paste into standard diagram viewers.",
    Diagram: "Used by architects — visual context for the reviewed architecture.",
    Inventory: "Used by architects — component and dependency inventory for delivery planning.",
    CostSummary: "Used by sponsor and architects — cost posture sanity check for the design.",
    ComplianceMatrix: "Used for audit — control coverage versus the manifest posture.",
    CoverageSummary: "Used for audit — coverage signals tied to requirements or controls.",
    EvidenceBundle: "Used for audit — traceability and evidence exports.",
    UnresolvedIssuesReport: "Used by sponsor — open checklist items before finalize.",
    ReferenceArchitectureMarkdown: "Used by architects — narrative reference for build-out and review.",
  };

  return lineByType[normalizedType] ?? null;
}

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

  return stripped;
}

/**
 * Buyer/sponsor table: verb-led preview link (assessment — avoid generic “View”).
 */
export function sponsorArtifactOpenActionLabel(artifactType: string): string {
  const normalizedType = artifactType.trim();

  const map: Record<string, string> = {
    MarkdownReport: "Open sponsor brief",
    ArchitectureNarrative: "Open architecture narrative",
    JsonBundle: "Open decision record",
    EvidenceBundle: "Open audit evidence",
    ComplianceMatrix: "Open compliance matrix",
    CoverageSummary: "Open coverage summary",
    UnresolvedIssuesReport: "Open issues summary",
    CostSummary: "Open cost summary",
    Inventory: "Open inventory",
    DiagramAst: "Open diagram structure",
    MermaidDiagram: "Open diagram source",
    Diagram: "Open diagram",
    ReferenceArchitectureMarkdown: "Open reference architecture",
  };

  return map[normalizedType] ?? "Open output";
}

/** Buyer/sponsor table: matching download verb per artifact role. */
export function sponsorArtifactDownloadActionLabel(artifactType: string): string {
  const normalizedType = artifactType.trim();

  const map: Record<string, string> = {
    MarkdownReport: "Download sponsor brief",
    ArchitectureNarrative: "Download narrative",
    JsonBundle: "Download decision record",
    EvidenceBundle: "Download audit evidence",
    ComplianceMatrix: "Download compliance matrix",
    CoverageSummary: "Download coverage summary",
    UnresolvedIssuesReport: "Download issues summary",
    CostSummary: "Download cost summary",
    Inventory: "Download inventory",
    DiagramAst: "Download diagram structure",
    MermaidDiagram: "Download diagram source",
    Diagram: "Download diagram",
    ReferenceArchitectureMarkdown: "Download reference architecture",
  };

  return map[normalizedType] ?? "Download";
}

/** Returns a one-line description of what an artifact type represents, for the preview panel header. */
export function getArtifactTypeDescription(artifactType: string): string {
  const entry = ARTIFACT_TYPE_COPY[artifactType];

  if (entry) {
    return entry.description;
  }

  return `Synthesized artifact of type "${artifactType}". Use metadata and content below to orient; download if you need an offline copy.`;
}

export type PreparedArtifactBody = {
  viewKind: ArtifactViewKind;
  /** Human-oriented body (pretty JSON when applicable). */
  readableText: string;
  /** Original UTF-8 text from the API (for raw disclosure). */
  rawText: string;
  /** True when JSON pretty-print failed; readableText falls back to raw. */
  jsonPrettyFailed: boolean;
};

/**
 * Produces readable vs raw UTF-8 text for review panels (deterministic, no HTML injection).
 */
export function prepareArtifactBodyText(
  utf8Text: string,
  format: string,
  artifactType: string,
): PreparedArtifactBody {
  const rawText = utf8Text;
  const viewKind = classifyArtifactView(format, artifactType);

  if (viewKind !== "json") {
    return {
      viewKind,
      readableText: utf8Text,
      rawText,
      jsonPrettyFailed: false,
    };
  }

  try {
    const parsed: unknown = JSON.parse(utf8Text);

    return {
      viewKind,
      readableText: `${JSON.stringify(parsed, null, 2)}\n`,
      rawText,
      jsonPrettyFailed: false,
    };
  } catch {
    return {
      viewKind,
      readableText: utf8Text,
      rawText,
      jsonPrettyFailed: true,
    };
  }
}
