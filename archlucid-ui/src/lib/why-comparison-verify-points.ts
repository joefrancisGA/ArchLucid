import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

/**
 * One row per front-door hard-comparison claim (same order as `WHY_COMPARISON_ROWS` / COMPETITIVE_LANDSCAPE.md).
 * Buyer-safe Verify anchors only — no `docs/library/*` or `docs/security/*` contributor paths (TB-1304).
 * Cold funnel Verify uses Claims static showcase (M-107 Option A) — not Contoso `/demo/preview`.
 * CI: row count locked in `why-comparison.test.ts`.
 */
export type WhyVerifyLink = {
  readonly label: string;
  readonly href: string;
};

export const WHY_COMPARISON_VERIFY_LINK_ROWS: readonly WhyVerifyLink[][] = [
  [{ label: "Claims sample architecture review", href: CANONICAL_ANONYMOUS_PROOF_HREF }],
  [
    { label: "Assurance evidence bundle (ZIP)", href: "/v1/marketing/trust-center/evidence-pack.zip" },
    { label: "Audit trail", href: "/help/audit-trail" },
  ],
  [
    { label: "Data handling and tenant isolation", href: "/help/data-handling-tenant-isolation" },
    { label: "Security & trust", href: "/security-trust" },
  ],
  [
    { label: "Authentication and sign-in", href: "/help/authentication-sign-in" },
    { label: "Trust center", href: "/trust" },
  ],
  [{ label: "Compare and replay", href: "/help/comparison-replay" }],
  [{ label: "Claims evidence trail", href: CANONICAL_ANONYMOUS_PROOF_HREF }],
  [{ label: "Governance approval", href: "/help/governance-approval" }],
];
