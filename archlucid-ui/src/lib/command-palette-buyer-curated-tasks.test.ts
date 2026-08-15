import { describe, expect, it } from "vitest";

import { BUYER_COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-buyer-curated-tasks";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("BUYER_COMMAND_PALETTE_CURATED_TASKS", () => {
  it("lists golden-path showcase destinations including compare and governance", () => {
    const hrefs = BUYER_COMMAND_PALETTE_CURATED_TASKS.map((task) => task.href);

    expect(hrefs).toContain(`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`);
    expect(hrefs.some((h) => h.includes("/insights/compare-two-reviews?"))).toBe(true);
    expect(hrefs.some((h) => h.includes(`/governance/approval-queue?runId=`))).toBe(true);
    expect(hrefs).toContain("/governance/findings");
    expect(hrefs.some((h) => h.includes(`/governance/audit?runId=`))).toBe(true);
  });

  /**
   * The buyer palette shows these rows beside the same nav, so a row must not invent a second name
   * for a destination the sidebar already names (this row used to read "Review records and
   * dispositions" for the page every other surface calls "Findings").
   */
  it("names shared destinations with the canonical nav labels", () => {
    const byHref = new Map(BUYER_COMMAND_PALETTE_CURATED_TASKS.map((task) => [task.href, task]));

    expect(byHref.get("/governance/findings")?.label).toBe(OPERATOR_NAV_LINK_LABELS.findings);
    expect(byHref.get("/governance/findings")?.searchValue).toMatch(/review records/i);
  });
});
