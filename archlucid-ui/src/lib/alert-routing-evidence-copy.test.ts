import { describe, expect, it } from "vitest";

import {
  ALERT_ROUTING_ORIENTATION_SOURCES,
  ALERT_ROUTING_SOURCES,
  ALERT_ROUTING_TAB_PATH,
} from "@/lib/alert-routing-evidence-copy";

describe("alert-routing-evidence-copy (GON)", () => {
  it("excludes self-href to the notifications tab from orientation Sources", () => {
    const orientationHrefs = ALERT_ROUTING_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(ALERT_ROUTING_TAB_PATH);
    expect(ALERT_ROUTING_ORIENTATION_SOURCES.length).toBeLessThan(ALERT_ROUTING_SOURCES.length);
    expect(ALERT_ROUTING_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
