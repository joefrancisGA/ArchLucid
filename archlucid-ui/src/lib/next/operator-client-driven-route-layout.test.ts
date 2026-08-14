import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const CLIENT_DRIVEN_LAYOUTS = [
  "src/app/(operator)/architecture/digests/layout.tsx",
  "src/app/(operator)/architecture/first-review-guide/layout.tsx",
  "src/app/(operator)/architecture/architectures/layout.tsx",
  "src/app/(operator)/architecture/sponsor-dashboard/layout.tsx",
  "src/app/(operator)/architecture/reviews/new/layout.tsx",
  "src/app/(operator)/governance/advisory-scans/layout.tsx",
  "src/app/(operator)/governance/layout.tsx",
  "src/app/(operator)/governance/alerts/layout.tsx",
  "src/app/(operator)/governance/audit/layout.tsx",
  "src/app/(operator)/governance/standards-and-rules/layout.tsx",
  "src/app/(operator)/governance/signed-records/layout.tsx",
  "src/app/(operator)/governance/signed-records/[manifestId]/layout.tsx",
  "src/app/(operator)/administration/layout.tsx",
  "src/app/(operator)/administration/system-health/layout.tsx",
  "src/app/(operator)/demo/layout.tsx",
  "src/app/(operator)/internal/layout.tsx",
  "src/app/(operator)/internal/validate-route/layout.tsx",
  "src/app/(operator)/internal/product-learning/layout.tsx",
  "src/app/(operator)/internal/fleet-llm-cogs/layout.tsx",
  "src/app/(operator)/integrations/layout.tsx",
  "src/app/(operator)/insights/ask-review-questions/layout.tsx",
  "src/app/(operator)/insights/architecture-scorecard/layout.tsx",
  "src/app/(operator)/insights/compare-two-reviews/layout.tsx",
  "src/app/(operator)/insights/evidence-graph/layout.tsx",
  "src/app/(operator)/insights/impact-preview/layout.tsx",
  "src/app/(operator)/insights/improvement-planning/layout.tsx",
  "src/app/(operator)/insights/patterns/layout.tsx",
  "src/app/(operator)/insights/search-review-evidence/layout.tsx",
] as const;

const CLIENT_DRIVEN_LAYOUTS_WITHOUT_FORCE_DYNAMIC = [
  ...CLIENT_DRIVEN_LAYOUTS,
  "src/app/(operator)/insights/improvement-planning/plans/[planId]/layout.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/layout.tsx",
  "src/app/(operator)/governance/policy-packs/[id]/layout.tsx",
  "src/app/(operator)/governance/approval-requests/[id]/layout.tsx",
  "src/app/(operator)/governance/approval-requests/[id]/lineage/layout.tsx",
] as const;

describe("operator client-driven route layouts (TB-2123)", () => {
  it.each(CLIENT_DRIVEN_LAYOUTS)("does not blanket force-dynamic on %s", (relativePath) => {
    const source = readFileSync(join(repoRoot, relativePath), "utf8");

    expect(source).not.toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain("OperatorClientDrivenRouteLayout");
  });
});

describe("operator insights layouts without blanket force-dynamic (TB-2143)", () => {
  it.each(CLIENT_DRIVEN_LAYOUTS_WITHOUT_FORCE_DYNAMIC)(
    "does not export force-dynamic on %s",
    (relativePath) => {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(source).not.toContain('export const dynamic = "force-dynamic"');
      expect(source).not.toContain('export const fetchCache = "force-no-store"');
    },
  );
});
