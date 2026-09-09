/**
 * TB-2197 / TB-2274 - page-level "what this surface cannot do" capability boundary.
 * Compact cannot-do strips to stop over-trust; Azure permissions help remains the
 * detailed cloud-connection SoT (AZURE_CLOUD_CONNECTION_CANNOT_DO).
 */

export const PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY =
  "What this page does not do" as const;

export type PageCapabilityBoundarySurfaceId =
  | "ask"
  | "compare"
  | "governanceFindings"
  | "assignedFindings"
  | "architectureIntelligence"
  | "impactPreview"
  | "advisoryScans"
  | "searchReviewEvidence";

export type PageCapabilityBoundary = {
  readonly heading: string;
  readonly items: readonly string[];
};

/** Ask hub - evidence-scoped Q&A; does not own governance or invent architecture. */
export const PAGE_CAPABILITY_BOUNDARY_ASK: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Approve, reject, or finalize architecture reviews.",
    "Write dispositions into the Decision register or replace formal approval records.",
    "Invent architecture or evidence outside the selected finalized review.",
    "Serve as an unaudited general-purpose chat transcript that becomes your system of record.",
  ],
};

/** Compare hub - structured delta between two finalized reviews only. */
export const PAGE_CAPABILITY_BOUNDARY_COMPARE: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Mutate either review's finalized review record or attached evidence.",
    "Approve, reject, or finalize packages from the comparison view.",
    "Invent findings or architecture outside the two selected packages.",
    "Replace the Decision register or approval workflows.",
  ],
};

/** Policy findings / risk register - track open risks; does not remediate or author policy. */
export const PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Automatically remediate cloud or application configuration.",
    "Author or change policy packs and policy rules.",
    "Invent risks that are not traceable to findings, waivers, exceptions, or approval.",
    "Replace the Decision register or finalized review record as the authority of record.",
  ],
};

/** Assigned-to-me findings queue — personal remediation scope only. */
export const PAGE_CAPABILITY_BOUNDARY_ASSIGNED_FINDINGS: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Show findings assigned to other operators or unassigned workspace items.",
    "Automatically remediate cloud or application configuration.",
    "Replace the tenant findings queue or Decision register as the system of record.",
    "Invent findings that are not traceable to reviews, evidence trails, or approval records.",
  ],
};

/** Architecture intelligence - closed-loop reasoning; does not finalize or replace governance. */
export const PAGE_CAPABILITY_BOUNDARY_ARCHITECTURE_INTELLIGENCE: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Finalize an architecture package or create a finalized review record by itself.",
    "Approve, reject, or write Decision register dispositions.",
    "Deploy or change cloud infrastructure from reasoning output.",
    "Replace advisory scans, impact preview, or pairwise compare as the system of record.",
  ],
};

/** Impact preview - simulated change impact; does not mutate packages or govern. */
export const PAGE_CAPABILITY_BOUNDARY_IMPACT_PREVIEW: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Mutate the baseline architecture package or its finalized review record.",
    "Approve, reject, or finalize packages from a simulation.",
    "Replace pairwise Compare of two finalized architecture packages.",
    "Author policy packs or write Decision register dispositions.",
  ],
};

/** Advisory scans - improvement recommendations; does not remediate or finalize. */
export const PAGE_CAPABILITY_BOUNDARY_ADVISORY_SCANS: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Automatically remediate findings or cloud configuration.",
    "Finalize architecture packages or create finalized review records.",
    "Replace the findings queue or Decision register.",
    "Author or publish policy packs from a scan recommendation.",
  ],
};

/** Search review evidence - retrieval over the evidence index; does not invent or govern. */
export const PAGE_CAPABILITY_BOUNDARY_SEARCH_REVIEW_EVIDENCE: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Invent findings, decisions, or evidence that are not in the evidence index.",
    "Approve, reject, or finalize architecture packages from search results.",
    "Write Decision register dispositions or replace the audit trail.",
    "Serve as Ask review questions — search retrieves; Ask answers with citations.",
  ],
};

const PAGE_CAPABILITY_BOUNDARY_BY_SURFACE: Record<
  PageCapabilityBoundarySurfaceId,
  PageCapabilityBoundary
> = {
  ask: PAGE_CAPABILITY_BOUNDARY_ASK,
  compare: PAGE_CAPABILITY_BOUNDARY_COMPARE,
  governanceFindings: PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
  assignedFindings: PAGE_CAPABILITY_BOUNDARY_ASSIGNED_FINDINGS,
  architectureIntelligence: PAGE_CAPABILITY_BOUNDARY_ARCHITECTURE_INTELLIGENCE,
  impactPreview: PAGE_CAPABILITY_BOUNDARY_IMPACT_PREVIEW,
  advisoryScans: PAGE_CAPABILITY_BOUNDARY_ADVISORY_SCANS,
  searchReviewEvidence: PAGE_CAPABILITY_BOUNDARY_SEARCH_REVIEW_EVIDENCE,
};

/** Resolve the cannot-do boundary for a mounted operator surface. */
export function getPageCapabilityBoundary(
  surfaceId: PageCapabilityBoundarySurfaceId,
): PageCapabilityBoundary {
  return PAGE_CAPABILITY_BOUNDARY_BY_SURFACE[surfaceId];
}
