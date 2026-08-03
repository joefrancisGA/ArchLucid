import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const controllerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "use-alerts-inbox-controller.ts"),
  "utf8",
);

describe("alerts inbox mount fan-out (TB-2023)", () => {
  it("loads summary via dedicated inbox-summary endpoint, not N× listAlertsPaged", () => {
    expect(controllerSource).toContain("getAlertsInboxSummary");
    expect(controllerSource).toContain("refreshSummary");

    const summaryFn = controllerSource.match(
      /const loadSummaryCounts = useCallback\(async \(\): Promise<void> => \{[\s\S]*?\}, \[\]\);/,
    );

    expect(summaryFn?.[0] ?? "").toContain("getAlertsInboxSummary");
    expect(summaryFn?.[0] ?? "").not.toContain("listAlertsPaged");
  });

  it("does not re-fetch summary in the default list load finally path", () => {
    expect(controllerSource).toContain("options?.refreshSummary === true");
    expect(controllerSource).not.toMatch(/finally \{\s*setLoading\(false\);\s*void loadSummaryCounts\(\);/s);
  });
});
