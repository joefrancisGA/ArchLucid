import {
  ACCELERATOR_PACK_START_FOLLOWUP_LABEL,
  ACCELERATOR_PACK_START_GREENFIELD_LABEL,
  acceleratorPackRequiresSignedReviewRecord,
} from "@/lib/accelerator-chooser-pack-prerequisite";

/** Visible start CTA label shared across accelerator chooser surfaces (greenfield packs). */
export const ACCELERATOR_PACK_START_VISIBLE_LABEL = ACCELERATOR_PACK_START_GREENFIELD_LABEL;

/** Screen-reader suffix preserving pack context without replacing visible CTA text. */
export function buildAcceleratorPackStartScreenReaderSuffix(packLabel: string, buyerJob: string): string {
  return ` — ${packLabel} for ${buyerJob}`;
}

export function resolveAcceleratorPackStartVisibleLabel(packId: string): string {
  if (acceleratorPackRequiresSignedReviewRecord(packId)) {
    return ACCELERATOR_PACK_START_FOLLOWUP_LABEL;
  }

  return ACCELERATOR_PACK_START_GREENFIELD_LABEL;
}

/** Distinct accessible name for accelerator pack start CTAs (legacy aria-label callers). */
export function buildAcceleratorPackStartAriaLabel(packLabel: string, buyerJob: string, packId: string): string {
  return `${resolveAcceleratorPackStartVisibleLabel(packId)}${buildAcceleratorPackStartScreenReaderSuffix(packLabel, buyerJob)}`;
}
