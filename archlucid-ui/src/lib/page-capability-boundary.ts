/**
 * TB-2197 - page-level "what this surface cannot do" capability boundary.
 * Compact cannot-do strips to stop over-trust; Azure permissions help remains the
 * detailed cloud-connection SoT (AZURE_CLOUD_CONNECTION_CANNOT_DO).
 */

export const PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY =
  "What this page does not do" as const;

export type PageCapabilityBoundarySurfaceId =
  | "ask"
  | "compare"
  | "governanceFindings";

export type PageCapabilityBoundary = {
  readonly heading: string;
  readonly items: readonly string[];
};

/** Ask hub - evidence-scoped Q&A; does not own governance or invent architecture. */
export const PAGE_CAPABILITY_BOUNDARY_ASK: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Approve, reject, or finalize architecture packages.",
    "Write dispositions into the Decision register or replace formal governance records.",
    "Invent architecture or evidence outside the selected finalized review.",
    "Serve as an unaudited general-purpose chat transcript that becomes your system of record.",
  ],
};

/** Compare hub - structured delta between two finalized reviews only. */
export const PAGE_CAPABILITY_BOUNDARY_COMPARE: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Mutate either review's signed review record or attached evidence.",
    "Approve, reject, or finalize packages from the comparison view.",
    "Invent findings or architecture outside the two selected packages.",
    "Replace the Decision register or governance approval workflows.",
  ],
};

/** Governance findings / risk register - track governed risks; does not remediate or author policy. */
export const PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS: PageCapabilityBoundary = {
  heading: PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  items: [
    "Automatically remediate cloud or application configuration.",
    "Author or change policy packs and policy rules.",
    "Invent risks that are not traceable to findings, waivers, exceptions, or governance decisions.",
    "Replace the Decision register or signed review record as the authority of record.",
  ],
};

const PAGE_CAPABILITY_BOUNDARY_BY_SURFACE: Record<
  PageCapabilityBoundarySurfaceId,
  PageCapabilityBoundary
> = {
  ask: PAGE_CAPABILITY_BOUNDARY_ASK,
  compare: PAGE_CAPABILITY_BOUNDARY_COMPARE,
  governanceFindings: PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
};

/** Resolve the cannot-do boundary for a mounted operator surface. */
export function getPageCapabilityBoundary(
  surfaceId: PageCapabilityBoundarySurfaceId,
): PageCapabilityBoundary {
  return PAGE_CAPABILITY_BOUNDARY_BY_SURFACE[surfaceId];
}
