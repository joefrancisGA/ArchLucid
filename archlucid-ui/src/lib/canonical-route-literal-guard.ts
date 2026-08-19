import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";

/** A route that has a canonical constant, so copy modules must not spell it as a literal. */
export interface CanonicalRouteBinding {
  /** Current route value, read from the canonical constant rather than duplicated here. */
  readonly path: string;
  /** Identifier to import, named for the failure message. */
  readonly constant: string;
  /** Module specifier the identifier is exported from. */
  readonly module: string;
}

export interface CanonicalRouteLiteralViolation {
  readonly file: string;
  readonly line: number;
  readonly path: string;
  readonly constant: string;
  readonly module: string;
  readonly text: string;
}

const GOVERNANCE_ROUTE_PATHS_MODULE = "@/lib/governance/governance-route-paths";

export const CANONICAL_ROUTE_LITERAL_BINDINGS: readonly CanonicalRouteBinding[] = [
  { path: GOVERNANCE_AUDIT_PATH, constant: "GOVERNANCE_AUDIT_PATH", module: GOVERNANCE_ROUTE_PATHS_MODULE },
  { path: GOVERNANCE_FINDINGS_PATH, constant: "GOVERNANCE_FINDINGS_PATH", module: GOVERNANCE_ROUTE_PATHS_MODULE },
  { path: GOVERNANCE_ALERTS_PATH, constant: "GOVERNANCE_ALERTS_PATH", module: GOVERNANCE_ROUTE_PATHS_MODULE },
  { path: GOVERNANCE_ALERT_RULES_PATH, constant: "GOVERNANCE_ALERT_RULES_PATH", module: GOVERNANCE_ROUTE_PATHS_MODULE },
  {
    path: GOVERNANCE_APPROVAL_QUEUE_PATH,
    constant: "GOVERNANCE_APPROVAL_QUEUE_PATH",
    module: GOVERNANCE_ROUTE_PATHS_MODULE,
  },
  {
    path: GOVERNANCE_POLICY_PACKS_PATH,
    constant: "GOVERNANCE_POLICY_PACKS_PATH",
    module: GOVERNANCE_ROUTE_PATHS_MODULE,
  },
  {
    path: GOVERNANCE_DECISION_REGISTER_PATH,
    constant: "GOVERNANCE_DECISION_REGISTER_PATH",
    module: GOVERNANCE_ROUTE_PATHS_MODULE,
  },
  {
    path: GOVERNANCE_STANDARDS_AND_RULES_PATH,
    constant: "GOVERNANCE_STANDARDS_AND_RULES_PATH",
    module: GOVERNANCE_ROUTE_PATHS_MODULE,
  },
  { path: ADVISORY_SCANS_HREF, constant: "ADVISORY_SCANS_HREF", module: "@/lib/advisory-scans-route" },
];

/** Prose mentions of a route in a doc comment are documentation, not a link target. */
function isCommentLine(line: string): boolean {
  const trimmed = line.trimStart();

  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

/**
 *  Only an exact quoted match counts. A longer path that merely starts with the canonical route
 *  (`"/governance/policy-packs/[id]"`) is a different route and may have no constant of its own.
 */
function lineQuotesExactPath(line: string, routePath: string): boolean {
  return ['"', "'", "`"].some((quote) => line.includes(`${quote}${routePath}${quote}`));
}

function violationsForLine(
  file: string,
  line: string,
  lineNumber: number,
): readonly CanonicalRouteLiteralViolation[] {
  if (isCommentLine(line)) {
    return [];
  }

  return CANONICAL_ROUTE_LITERAL_BINDINGS.filter((binding) => lineQuotesExactPath(line, binding.path)).map(
    (binding) => ({
      file,
      line: lineNumber,
      path: binding.path,
      constant: binding.constant,
      module: binding.module,
      text: line.trim(),
    }),
  );
}

export function findCanonicalRouteLiteralViolations(
  file: string,
  contents: string,
): readonly CanonicalRouteLiteralViolation[] {
  if (contents.length === 0) {
    return [];
  }

  return contents
    .split(/\r?\n/)
    .flatMap((line, index) => violationsForLine(file, line, index + 1));
}

export function describeCanonicalRouteLiteralViolation(violation: CanonicalRouteLiteralViolation): string {
  return `${violation.file}:${violation.line} uses the literal "${violation.path}" — import ${violation.constant} from "${violation.module}" instead.\n    ${violation.text}`;
}
