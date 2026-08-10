/** Visible start CTA label shared across accelerator chooser surfaces. */
export const ACCELERATOR_PACK_START_VISIBLE_LABEL = "Start with this pack" as const;

/** Screen-reader suffix preserving pack context without replacing visible CTA text. */
export function buildAcceleratorPackStartScreenReaderSuffix(packLabel: string, buyerJob: string): string {
  return ` — ${packLabel} for ${buyerJob}`;
}

/** Distinct accessible name for accelerator pack start CTAs (legacy aria-label callers). */
export function buildAcceleratorPackStartAriaLabel(packLabel: string, buyerJob: string): string {
  return `${ACCELERATOR_PACK_START_VISIBLE_LABEL}${buildAcceleratorPackStartScreenReaderSuffix(packLabel, buyerJob)}`;
}
