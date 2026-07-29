/**
 * TB-1250 — Help-center `internal` tier + `technical-documentation` contentKind
 * is forbidden unless the slug is listed here with a consumer-safe rationale.
 *
 * Eng-facing topics must use `internal-runbook` (TB-735 Admin gate) instead.
 */
export const HELP_CENTER_INTERNAL_TECHNICAL_DOCUMENTATION_ALLOWLIST: Readonly<
  Record<string, string>
> = {
  "admin-diagnostics":
    "Customer-facing Admin ops reference (OPERATOR_ADMIN_DIAGNOSTICS.md); not eng CLI/env runbook content.",
};
