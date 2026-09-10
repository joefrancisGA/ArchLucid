/**
 * CA-50 wave-close grep targets — operator UI modules that must not treat DraftId as ArchitectureId.
 * Guard test fails when forbidden substrings appear in listed paths or scan roots.
 */
export const CUSTOMER_ARCHITECTURE_ACCEPTANCE_UI_SCAN_ROOTS = [
  "components/architecture",
  "hooks",
  "app/(operator)/architecture",
  "lib/architecture",
] as const;

export const CUSTOMER_ARCHITECTURE_ACCEPTANCE_UI_FORBIDDEN_PATTERNS = [
  /\barchitectureId\s*=\s*created\.draftId\b/,
  /\barchitectureId\s*:\s*created\.draftId\b/,
  /\bgetDraftRequest\(\s*architectureId\b/,
  /\beffectiveArchitectureId\b/,
] as const;

/** Working hub must branch on workspace mode before mounting draft inventory (CA-25 / CA-50). */
export const CUSTOMER_ARCHITECTURE_WORKING_HUB_LIST_MODULE =
  "app/(operator)/architecture/architectures/_sections/ArchitecturesHubListSection.tsx";

export const CUSTOMER_ARCHITECTURE_ADR_0074_RELATIVE_PATH =
  "docs/architecture/adrs/0074-customer-visible-architecture-identity.md";
