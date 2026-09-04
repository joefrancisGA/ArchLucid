/**
 * Sponsor-facing artifact audience copy and deliverable tab grouping.
 */

/**
 * One-line audience hint for sponsor-mode tables (who uses the file and why).
 * Returns null when the artifact type is unknown to keep the table scannable.
 */
export function sponsorArtifactAudienceLine(artifactType: string): string | null {
  const normalizedType = artifactType.trim();

  const lineByType: Record<string, string> = {
    MarkdownReport: "Used by executives — readout and sign-off context.",
    ArchitectureNarrative: "Used by executives — plain-language summary for stakeholders.",
    JsonBundle: "Used by architects — decision record, traceability, and handoffs.",
    DiagramAst: "Used by architects — machine-readable structure for diagrams and tooling.",
    MermaidDiagram:
      "Used by architects — diagram source reviewers can paste into standard diagram viewers.",
    Diagram: "Used by architects — visual context for the reviewed architecture.",
    Inventory: "Used by architects — component and dependency inventory for delivery planning.",
    CostSummary: "Used by sponsor and architects — cost posture sanity check for the design.",
    ComplianceMatrix: "Used for audit — control coverage versus the review posture.",
    CoverageSummary: "Used for audit — coverage signals tied to requirements or controls.",
    EvidenceBundle: "Used for audit — traceability and evidence exports.",
    UnresolvedIssuesReport: "Used by executives — open checklist items before finalize.",
    ReferenceArchitectureMarkdown: "Used by architects — narrative reference for build-out and review.",
  };

  return lineByType[normalizedType] ?? null;
}

/**
 * Buyer/sponsor table: verb-led preview link (assessment — avoid generic “View”).
 */
export function sponsorArtifactOpenActionLabel(artifactType: string): string {
  const normalizedType = artifactType.trim();

  const map: Record<string, string> = {
    MarkdownReport: "Open sponsor briefing",
    ArchitectureNarrative: "Open architecture narrative",
    JsonBundle: "Open decision record",
    EvidenceBundle: "Open audit evidence",
    ComplianceMatrix: "Open compliance matrix",
    CoverageSummary: "Open coverage summary",
    UnresolvedIssuesReport: "Open residual risk summary",
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
    MarkdownReport: "Download sponsor briefing",
    ArchitectureNarrative: "Download narrative",
    JsonBundle: "Download decision record",
    EvidenceBundle: "Download audit evidence",
    ComplianceMatrix: "Download compliance matrix",
    CoverageSummary: "Download coverage summary",
    UnresolvedIssuesReport: "Download residual risk summary",
    CostSummary: "Download cost summary",
    Inventory: "Download inventory",
    DiagramAst: "Download diagram structure",
    MermaidDiagram: "Download diagram source",
    Diagram: "Download diagram",
    ReferenceArchitectureMarkdown: "Download reference architecture",
  };

  return map[normalizedType] ?? "Download";
}

export type SponsorArtifactAudienceBucket = "sponsor" | "shared" | "architects" | "audit" | "other";

/** Buyer deliverables tab: sponsor + cross-functional shared outputs. */
export const DELIVERABLE_TAB_SPONSOR_BUCKETS: readonly SponsorArtifactAudienceBucket[] = ["sponsor", "shared"];

/** Buyer deliverables tab: engineering handoff, audit exports, and miscellaneous package attachments. */
export const DELIVERABLE_TAB_ARB_BUCKETS: readonly SponsorArtifactAudienceBucket[] = ["architects", "audit", "other"];

const AUDIENCE_SECTION_COPY: Record<
  SponsorArtifactAudienceBucket,
  { readonly title: string; readonly lead: string }
> = {
  sponsor: {
    title: "Sponsor briefing",
    lead: "Outputs executives use for sign-off, briefing leadership, and readiness checkpoints.",
  },
  shared: {
    title: "Sponsor & architecture",
    lead: "Deliverables shared across sponsor and architecture reviewers.",
  },
  architects: {
    title: "Architecture review board",
    lead: "Decision records, diagrams, and inventories for engineering handoff.",
  },
  audit: {
    title: "Audit & compliance",
    lead: "Trace bundles and coverage artifacts auditors can cite.",
  },
  other: {
    title: "Additional outputs",
    lead: "Supporting exports attached to this package.",
  },
};

/** Buckets sponsor-mode rows for manifest-style grouping (uses {@link sponsorArtifactAudienceLine} semantics). */
export function sponsorArtifactAudienceBucket(artifactType: string): SponsorArtifactAudienceBucket {
  const raw = sponsorArtifactAudienceLine(artifactType);

  if (raw === null || raw.trim().length === 0) {
    return "other";
  }

  const line = raw.toLowerCase();
  const mentionsSponsorAudience = line.includes("sponsor") || line.includes("sponsor");
  const mentionsArchitect = line.includes("architect");
  const mentionsAudit = line.includes("audit") || line.includes("compliance");

  const topicHits = [mentionsSponsorAudience, mentionsArchitect, mentionsAudit].filter(Boolean).length;

  if (topicHits >= 2) {
    return "shared";
  }

  if (mentionsAudit) {
    return "audit";
  }

  if (mentionsArchitect) {
    return "architects";
  }

  if (mentionsSponsorAudience) {
    return "sponsor";
  }

  return "other";
}

export function sponsorAudienceSectionHeading(bucket: SponsorArtifactAudienceBucket): string {
  return AUDIENCE_SECTION_COPY[bucket].title;
}

export function sponsorAudienceSectionLead(bucket: SponsorArtifactAudienceBucket): string {
  return AUDIENCE_SECTION_COPY[bucket].lead;
}
