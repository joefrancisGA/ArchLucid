import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const controllerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "use-alerts-inbox-controller.ts"),
  "utf8",
);
const fetchSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "alerts-inbox-query-fetch.ts"),
  "utf8",
);

describe("alerts inbox mount fan-out (TB-2023 / TB-935)", () => {
  it("loads summary via dedicated inbox-summary endpoint, not N× listAlertsPaged", () => {
    expect(fetchSource).toContain("getAlertsInboxSummary");
    expect(fetchSource).not.toMatch(/fetchAlertsInboxSummary[\s\S]*listAlertsPaged/);
    expect(controllerSource).toContain("useAlertsInboxSummaryQuery");
    expect(controllerSource).toContain("refreshSummary");
  });

  it("only refreshes summary when mutations request it", () => {
    expect(controllerSource).toContain("options?.refreshSummary === true");
    expect(controllerSource).not.toContain("void loadSummaryCounts()");
  });

  it("uses TanStack Query for inbox page loads", () => {
    expect(controllerSource).toContain("useAlertsInboxPageQuery");
    expect(controllerSource).toContain("operatorQueryKeys.alertsInboxPage");
  });
});
