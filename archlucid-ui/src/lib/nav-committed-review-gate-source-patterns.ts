/** Nav surfaces that must share one committed-review gate input (TB-2330). */
export const NAV_COMMITTED_REVIEW_GATE_CONSUMER_RELATIVE_PATHS = [
  "src/hooks/useOperatorShellNavRows.ts",
  "src/components/CommandPalette.tsx",
  "src/app/(operator)/insights/impact-preview/_sections/use-is-operator-nav-href-reachable.ts",
] as const;

export const NAV_COMMITTED_REVIEW_EFFECTIVE_HOOK_IMPORT = "useEffectiveNavCommittedArchitectureReview";

const RAW_NAV_COMMITTED_HOOK_IMPORT_PATTERN =
  /\buseNavCommittedArchitectureReview\b/;

export function findNavCommittedReviewGateConsumerViolations(source: string): readonly string[] {
  const violations: string[] = [];

  if (!source.includes(NAV_COMMITTED_REVIEW_EFFECTIVE_HOOK_IMPORT)) {
    violations.push(`missing ${NAV_COMMITTED_REVIEW_EFFECTIVE_HOOK_IMPORT}()`);
  }

  if (RAW_NAV_COMMITTED_HOOK_IMPORT_PATTERN.test(source)) {
    violations.push("imports or calls raw useNavCommittedArchitectureReview");
  }

  return violations;
}
