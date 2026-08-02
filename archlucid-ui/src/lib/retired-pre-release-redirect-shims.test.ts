import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

type RetiredShim = {
  source: string;
  appPageRelativePath: string | null;
};

const RETIRED_SHIMS: readonly RetiredShim[] = [
  { source: "/alert-routing", appPageRelativePath: "src/app/(operator)/alert-routing/page.tsx" },
  { source: "/digest-subscriptions", appPageRelativePath: "src/app/(operator)/digest-subscriptions/page.tsx" },
  { source: "/advisory", appPageRelativePath: null },
  { source: "/advisory-scheduling", appPageRelativePath: null },
  { source: "/governance/first-30-days", appPageRelativePath: null },
  { source: "/admin/ai-usage-cost", appPageRelativePath: "src/app/(operator)/admin/ai-usage-cost/page.tsx" },
  { source: "/settings/cost-reporting", appPageRelativePath: null },
  { source: "/settings", appPageRelativePath: "src/app/(operator)/settings/page.tsx" },
  { source: "/settings/tenant", appPageRelativePath: "src/app/(operator)/settings/tenant/page.tsx" },
  { source: "/quick-start", appPageRelativePath: "src/app/(marketing)/quick-start/page.tsx" },
  { source: "/recommendation-learning", appPageRelativePath: "src/app/(operator)/recommendation-learning/page.tsx" },
  { source: "/login", appPageRelativePath: "src/app/login/page.tsx" },
  { source: "/onboard", appPageRelativePath: "src/app/(operator)/onboard/page.tsx" },
  { source: "/onboarding", appPageRelativePath: "src/app/(operator)/onboarding/page.tsx" },
  { source: "/onboarding/start", appPageRelativePath: "src/app/(operator)/onboarding/start/page.tsx" },
  { source: "/getting-started", appPageRelativePath: "src/app/(operator)/getting-started/page.tsx" },
  { source: "/graph", appPageRelativePath: "src/app/(operator)/graph/page.tsx" },
  { source: "/ask", appPageRelativePath: "src/app/(operator)/ask/page.tsx" },
  { source: "/search", appPageRelativePath: "src/app/(operator)/search/page.tsx" },
  { source: "/compare", appPageRelativePath: "src/app/(operator)/compare/page.tsx" },
  { source: "/evolution-review", appPageRelativePath: "src/app/(operator)/evolution-review/page.tsx" },
  {
    source: "/governance/resolution",
    appPageRelativePath: "src/app/(operator)/governance/resolution/page.tsx",
  },
  {
    source: "/governance-resolution",
    appPageRelativePath: "src/app/(operator)/governance-resolution/page.tsx",
  },
  { source: "/scorecard", appPageRelativePath: "src/app/(operator)/scorecard/page.tsx" },
  {
    source: "/sponsor-report/architecture-scorecard",
    appPageRelativePath: "src/app/(operator)/sponsor-report/architecture-scorecard/page.tsx",
  },
  {
    source: "/operate/architecture-graph",
    appPageRelativePath: "src/app/(operator)/operate/architecture-graph/page.tsx",
  },
];

describe("retired pre-release redirect shims", () => {
  it("does not ship next.config redirects for pruned legacy bookmarks", async () => {
    const redirectRules = await nextConfig.redirects?.();

    for (const shim of RETIRED_SHIMS) {
      expect(
        redirectRules?.find((rule) => rule.source === shim.source),
        `expected no next.config redirect for ${shim.source}`,
      ).toBeUndefined();
    }
  });

  it("does not ship App Router stub pages for pruned legacy bookmarks", () => {
    for (const shim of RETIRED_SHIMS) {
      if (shim.appPageRelativePath === null) {
        continue;
      }

      expect(existsSync(join(process.cwd(), shim.appPageRelativePath)), shim.appPageRelativePath).toBe(false);
    }
  });
});
