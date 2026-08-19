import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const hubDir = join(sectionsDir, "..");

const hubSource = readFileSync(join(hubDir, "AlertRulesHubClient.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "alert-rules-hub-deferred-chunks.tsx"), "utf8");
const conditionsSource = readFileSync(
  join(hubDir, "..", "..", "..", "..", "components", "alerts", "AlertRulesContent.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/alerts/AlertRulesContent"',
  '@/components/alerts/AlertRoutingContent"',
  '@/components/alerts/CompositeAlertRulesContent"',
  '@/components/alerts/AlertSimulationTuningSection"',
] as const;

describe("alert-rules hub deferred imports (TB-2024)", () => {
  it("keeps tab panels off the hub static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(hubSource).not.toContain(bannedImport);
    }

    expect(hubSource).toContain("alert-rules-hub-deferred-chunks");
    expect(hubSource).toContain("AlertRulesContentDeferred");
    expect(hubSource).toContain("AlertRoutingContentDeferred");
    expect(hubSource).toContain("CompositeAlertRulesContentDeferred");
    expect(hubSource).toContain("AlertSimulationTuningSectionDeferred");
  });

  it("dynamic-imports each hub tab panel", () => {
    expect(deferredSource).toContain('import("@/components/alerts/AlertRulesContent")');
    expect(deferredSource).toContain('import("@/components/alerts/AlertRoutingContent")');
    expect(deferredSource).toContain('import("@/components/alerts/CompositeAlertRulesContent")');
    expect(deferredSource).toContain('import("@/components/alerts/AlertSimulationTuningSection")');
    expect(deferredSource).toContain("next/dynamic");
  });

  it("loads conditions rules and routing subscriptions via shared hub queries", () => {
    const queriesSource = readFileSync(
      join(hubDir, "..", "..", "..", "..", "components", "alerts", "use-alert-rules-hub-queries.ts"),
      "utf8",
    );

    expect(conditionsSource).toContain("useAlertRulesListQuery");
    expect(conditionsSource).toContain("useAlertRoutingSubscriptionsQuery");
    expect(queriesSource).toContain("listAlertRules");
    expect(queriesSource).toContain("listAlertRoutingSubscriptions");
  });
});
