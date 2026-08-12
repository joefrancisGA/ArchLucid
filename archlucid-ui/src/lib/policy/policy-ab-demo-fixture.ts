import type { components } from "@/lib/openapi-schemas";

// Synthetic policy A/B demo fixture - internal demo validation only.
// Mirrors tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json and
// ArchLucid.Application.Tests/Governance/PolicyAbDemoFixture.cs; keep all three in sync.
// Not buyer-facing; not a certification or benchmark claim.

type PolicyPackGovernanceDryRunResult = components["schemas"]["PolicyPackGovernanceDryRunResult"];

export const POLICY_AB_DEMO_LABEL = "policy-ab-demo (synthetic - internal demo validation only)";

/** The single compliance rule key the stricter pack adds over the default pack. */
export const POLICY_AB_DEMO_ADDED_RULE_KEY = "demo-ctrl-network-isolation";

/** Compliance rule keys selected by the default (allow-path) pack. */
export const POLICY_AB_DEMO_DEFAULT_RULE_KEYS: readonly string[] = [
  "demo-ctrl-encryption-at-rest",
  "demo-ctrl-audit-logging",
];

/** Compliance rule keys selected by the stricter (block-path) pack - a strict superset. */
export const POLICY_AB_DEMO_STRICT_RULE_KEYS: readonly string[] = [
  "demo-ctrl-encryption-at-rest",
  "demo-ctrl-audit-logging",
  POLICY_AB_DEMO_ADDED_RULE_KEY,
];

/** Allow-path dry-run result for the default pack arm. */
export const POLICY_AB_DEMO_ALLOW_RESULT: PolicyPackGovernanceDryRunResult = {
  gateResult: { blocked: false, warnOnly: false },
  failedChecks: [],
};

/** Block-path dry-run result for the stricter pack arm. */
export const POLICY_AB_DEMO_BLOCK_RESULT: PolicyPackGovernanceDryRunResult = {
  gateResult: { blocked: true, warnOnly: false },
  failedChecks: ["pre_commit_severity_gate: would block commit (findings meet proposed minimum severity)"],
};
