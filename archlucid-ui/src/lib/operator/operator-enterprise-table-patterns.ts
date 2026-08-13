/**
 * TB-1650 — Static checks for allowlisted operator inventories on `EnterpriseTable`.
 */

export type OperatorEnterpriseTableGuardViolation = {
  readonly code: "missing-enterprise-table" | "raw-html-table" | "card-stack-inventory";
  readonly message: string;
};

const ENTERPRISE_TABLE_IMPORT_PATTERN = /\bEnterpriseTable\b/;
const ENTERPRISE_TABLE_JSX_PATTERN = /<EnterpriseTable[\s>]/;
const RAW_TABLE_PATTERN = /<table[\s>]/;

/**
 * Card stacks used as the primary populated inventory (map + bordered surface) are banned
 * on allowlisted inventory jobs when the module does not also render `EnterpriseTable`.
 */
const CARD_STACK_INVENTORY_PATTERN =
  /\.map\s*\([\s\S]*?<Card[\s>]/;

export function findOperatorEnterpriseTableGuardViolations(
  source: string,
): readonly OperatorEnterpriseTableGuardViolation[] {
  const violations: OperatorEnterpriseTableGuardViolation[] = [];

  if (!ENTERPRISE_TABLE_IMPORT_PATTERN.test(source) || !ENTERPRISE_TABLE_JSX_PATTERN.test(source)) {
    violations.push({
      code: "missing-enterprise-table",
      message: "Allowlisted inventory modules must import and render EnterpriseTable.",
    });
  }

  if (RAW_TABLE_PATTERN.test(source) && !ENTERPRISE_TABLE_JSX_PATTERN.test(source)) {
    violations.push({
      code: "raw-html-table",
      message: "Raw <table> markup is banned on allowlisted operator inventories.",
    });
  }

  if (CARD_STACK_INVENTORY_PATTERN.test(source) && !ENTERPRISE_TABLE_JSX_PATTERN.test(source)) {
    violations.push({
      code: "card-stack-inventory",
      message: "Card-stack inventories are banned when EnterpriseTable is absent.",
    });
  }

  return violations;
}

export function operatorEnterpriseTableModuleIsCompliant(source: string): boolean {
  return findOperatorEnterpriseTableGuardViolations(source).length === 0;
}
