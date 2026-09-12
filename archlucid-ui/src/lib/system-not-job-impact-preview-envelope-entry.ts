import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT } from "@/lib/impact-preview-page-copy";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_ENVELOPE_ENTRY_DOC_ANCHOR =
  "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md" as const;

/** Working nested Impact preview is the policy cheap envelope — not Career architecture what-if (SN-007 / ADR 0092). */
export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING =
  "Policy cheap envelope" as const;

export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY =
  "Impact preview re-simulates policy packs and recorded findings against a proposed change on a finalized baseline. This is review-time policy analysis — not a Career architecture what-if and not production observation." as const;

export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_PRODUCTION_DISCLAIMER = IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT;

export const SYSTEM_NOT_JOB_NESTED_IMPACT_PREVIEW_PAGE_SUBTITLE =
  "Policy cheap envelope on this architecture desk — simulate policy-pack and finding impact before you treat output as Career proof." as const;

export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_SKETCH_HELPER =
  "For architecture sketch envelopes, use clone from snapshot on the desk — labeled Rehearsal per ADR 0092 (SN-008)." as const;

export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_ARCHITECTURE_DESK_CTA_LABEL =
  "Open architecture desk for labeled clone sketch" as const;

export const SYSTEM_NOT_JOB_IMPACT_PREVIEW_CHEAP_PATH_OWNER = "SN-008" as const;

export function architectureDeskCloneSketchHref(architectureId: string): string {
  return architectureIdentityPath(architectureId.trim());
}
