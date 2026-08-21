import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));
const componentsAlertsDir = join(routeDir, "..", "..", "..", "..", "components", "alerts");

const chromeSource = readFileSync(join(routeDir, "AlertsHubChrome.tsx"), "utf8");
const interactiveSource = readFileSync(join(componentsAlertsDir, "AlertsInboxInteractiveClient.tsx"), "utf8");
const deferredSource = readFileSync(join(componentsAlertsDir, "alerts-inbox-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(componentsAlertsDir, "../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const bannedChromeImports = ['@/components/alerts/AlertsGovernanceContextPanel"'] as const;
const bannedInteractiveImports = ['@/components/alerts/AlertsInboxDialogs"'] as const;

describe("alerts inbox deferred imports (wave 11 hub First Load)", () => {
  it("keeps governance context panel off AlertsHubChrome static import graph", () => {
    for (const bannedImport of bannedChromeImports) {
      expect(chromeSource).not.toContain(bannedImport);
    }

    expect(chromeSource).toContain("alerts-inbox-deferred-chunks");
    expect(chromeSource).toContain("AlertsGovernanceContextPanelDeferred");
  });

  it("keeps inbox dialogs off AlertsInboxInteractiveClient static import graph", () => {
    for (const bannedImport of bannedInteractiveImports) {
      expect(interactiveSource).not.toContain(bannedImport);
    }

    expect(interactiveSource).toContain("alerts-inbox-deferred-chunks");
    expect(interactiveSource).toContain("AlertsInboxDialogsDeferred");
  });

  it("dynamic-imports every alerts inbox panel via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/alerts/AlertsGovernanceContextPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/alerts/AlertsInboxDialogs")');
    expect(deferredSource).toContain("alerts-inbox-governance-context-panel");
    expect(deferredSource).toContain("alerts-inbox-dialogs");
  });
});
