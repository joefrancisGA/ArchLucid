import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const alertsDir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(join(alertsDir, "page.tsx"), "utf8");

describe("TB-2026 alerts nested Suspense streaming", () => {
  it("streams alerts inbox under Suspense after hub chrome", () => {
    expect(pageSource).toContain("AlertsHubChrome");
    expect(pageSource).toContain("AlertsInboxStreamingBody");
    expect(pageSource).toContain("AlertsInboxPanelSkeleton");
    expect(pageSource).toContain("<Suspense");
    expect(pageSource).not.toContain("loadAlertsInboxPageModel");
    expect(pageSource).not.toContain("AlertsHubClient");
  });
});
