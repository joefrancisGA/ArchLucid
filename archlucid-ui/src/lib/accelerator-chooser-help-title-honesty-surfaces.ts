import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-page-copy";

/**
 * TB-1605 — accelerator-chooser help is product-tier buyer orientation; inbound chrome must use the
 * canonical page title and must not resurrect engineering “Accelerator chooser” vocabulary.
 */
export const ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL = ACCELERATOR_CHOOSER_HELP_PAGE_TITLE;

export const ACCELERATOR_CHOOSER_HELP_TITLE_HONESTY_SOURCE_FILES: readonly string[] = [
  "src/lib/accelerator-chooser-help-page-copy.ts",
  "src/lib/accelerator-chooser-help-guide-content.ts",
  "src/lib/product-documentation-registry.ts",
  "src/lib/help/help-center-catalog.ts",
  "src/lib/usability/page-help-topic-rows.ts",
  "src/lib/contextual-help/help-topic-rows.ts",
  "src/lib/path-chooser-help-evidence-copy.ts",
  "src/lib/accelerator-chooser-home-inbound-copy.ts",
  "src/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView.tsx",
] as const;

export const BANNED_ACCELERATOR_CHOOSER_HELP_CUSTOMER_TITLE_PATTERNS: readonly RegExp[] = [
  /Accelerator chooser/i,
  /Pick an accelerator pack/i,
  /label:\s*"Accelerator chooser"/,
  /title:\s*"Accelerator chooser"/,
  /title:\s*"Pick an accelerator pack"/,
] as const;

export const CANONICAL_ACCELERATOR_CHOOSER_HELP_TITLE_MARKERS: readonly string[] = [
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  "ACCELERATOR_CHOOSER_HELP_PAGE_TITLE",
  "ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL",
] as const;

export function sourceContainsBannedAcceleratorChooserHelpCustomerTitle(source: string): boolean {
  return BANNED_ACCELERATOR_CHOOSER_HELP_CUSTOMER_TITLE_PATTERNS.some((pattern) => pattern.test(source));
}

export function sourceDeclaresCanonicalAcceleratorChooserHelpTitle(source: string): boolean {
  return CANONICAL_ACCELERATOR_CHOOSER_HELP_TITLE_MARKERS.some((marker) => source.includes(marker));
}
