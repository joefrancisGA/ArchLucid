import { describe, expect, it } from "vitest";

import {
  ALERT_TEST_ALERTS_ORIENTATION_SOURCES,
  ALERT_TEST_ALERTS_TAB_PATH,
} from "@/lib/alert-test-alerts-evidence-copy";
import { ALERT_RULES_SOURCES } from "@/lib/alert-rules-evidence-copy";

describe("alert-test-alerts-evidence-copy (GOT)", () => {
  it("excludes self-href to the test-alerts tab from orientation Sources", () => {
    const orientationHrefs = ALERT_TEST_ALERTS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(ALERT_TEST_ALERTS_TAB_PATH);
    expect(ALERT_TEST_ALERTS_ORIENTATION_SOURCES.length).toBeLessThan(ALERT_RULES_SOURCES.length);
    expect(ALERT_TEST_ALERTS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
