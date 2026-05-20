import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";

/**
 * One row per front-door hard-comparison claim (same order as `WHY_COMPARISON_ROWS` / COMPETITIVE_LANDSCAPE.md).
 * CI: row count locked in `why-comparison.test.ts`.
 */
export type WhyVerifyLink = {
  readonly label: string;
  readonly href: string;
};

export const WHY_COMPARISON_VERIFY_LINK_ROWS: readonly WhyVerifyLink[][] = [
  [{ label: "Demo preview", href: "/demo/preview" }],
  [
    { label: "Assurance evidence package (ZIP)", href: "/v1/marketing/trust-center/evidence-pack.zip" },
    {
      label: "Durable audit coverage matrix",
      href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/AUDIT_COVERAGE_MATRIX.md`,
    },
  ],
  [
    {
      label: "Tenant isolation control summary",
      href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/security/MULTI_TENANT_RLS.md`,
    },
  ],
  [{ label: "Authentication scope (published scope doc)", href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/V1_SCOPE.md` }],
  [
    {
      label: "Comparison replay summary",
      href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/COMPARISON_REPLAY.md`,
    },
  ],
  [{ label: "Evidence trail demo", href: "/demo/preview" }],
  [
    {
      label: "Governance gate control description",
      href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`,
    },
  ],
];
