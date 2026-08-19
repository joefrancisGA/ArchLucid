import { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE } from "@/lib/admin-diagnostics-help-page-copy";

/**
 * TB-1610 — admin-diagnostics help is operator-safe platform-health orientation; inbound chrome must use
 * the canonical page title and must not resurrect engineering “Admin diagnostics” vocabulary.
 */
export const ADMIN_DIAGNOSTICS_HELP_INBOUND_LABEL = ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE;

export const ADMIN_DIAGNOSTICS_HELP_TITLE_HONESTY_SOURCE_FILES: readonly string[] = [
  "src/lib/admin-diagnostics-help-page-copy.ts",
  "src/lib/admin-diagnostics-help-evidence-copy.ts",
  "src/lib/admin-diagnostics-inbound-copy.ts",
  "src/lib/product-documentation-registry.ts",
  "src/lib/help/help-center-catalog.ts",
  "src/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView.tsx",
] as const;

export const BANNED_ADMIN_DIAGNOSTICS_HELP_CUSTOMER_TITLE_PATTERNS: readonly RegExp[] = [
  /Admin diagnostics/i,
  /title:\s*"Admin diagnostics"/,
  /ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE\s*=\s*"Admin diagnostics"/,
] as const;

export const CANONICAL_ADMIN_DIAGNOSTICS_HELP_TITLE_MARKERS: readonly string[] = [
  ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE,
  "ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE",
  "ADMIN_DIAGNOSTICS_HELP_INBOUND_LABEL",
] as const;

export function sourceContainsBannedAdminDiagnosticsHelpCustomerTitle(source: string): boolean {
  return BANNED_ADMIN_DIAGNOSTICS_HELP_CUSTOMER_TITLE_PATTERNS.some((pattern) => pattern.test(source));
}

export function sourceDeclaresCanonicalAdminDiagnosticsHelpTitle(source: string): boolean {
  return CANONICAL_ADMIN_DIAGNOSTICS_HELP_TITLE_MARKERS.some((marker) => source.includes(marker));
}
