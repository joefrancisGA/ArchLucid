import { CANONICAL_ANONYMOUS_PROOF_HREF, SECONDARY_CLAIMS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

/**
 * One row per front-door hard-comparison claim (same order as `WHY_COMPARISON_ROWS` / COMPETITIVE_LANDSCAPE.md).
 * Buyer-safe Verify anchors only — no `docs/library/*` or `docs/security/*` contributor paths (TB-1304).
 * Cold funnel Verify uses the primary static showcase (TB-981); Claims remains an explicit regulated-depth link.
 * CI: row count locked in `why-comparison.test.ts`.
 */
export type WhyVerifyLink = {
  readonly label: string;
  readonly href: string;
};

export const WHY_COMPARISON_VERIFY_LINK_ROWS: readonly WhyVerifyLink[][] = [
  [{ label: "Enterprise customer intake sample review", href: CANONICAL_ANONYMOUS_PROOF_HREF }],
  [
    { label: "Assurance evidence bundle (ZIP)", href: TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF },
    { label: "Audit trail", href: "/help/audit-trail" },
  ],
  [
    { label: "Data handling and tenant isolation", href: "/help/data-handling" },
    { label: "Assurance status", href: "/assurance-status" },
  ],
  [
    { label: "Authentication and sign-in", href: "/help/authentication-sign-in" },
    { label: "Trust center", href: "/trust" },
  ],
  [{ label: "Compare and replay", href: "/help/comparison-replay" }],
  [{ label: "Claims regulated-depth evidence trail", href: SECONDARY_CLAIMS_PROOF_HREF }],
  [{ label: "Resolve outcomes", href: "/help/governance-approval" }],
];
