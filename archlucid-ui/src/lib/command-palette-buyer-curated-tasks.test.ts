import { describe, expect, it } from "vitest";

import { BUYER_COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-buyer-curated-tasks";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("BUYER_COMMAND_PALETTE_CURATED_TASKS", () => {
  it("lists golden-path showcase destinations including compare and governance", () => {
    const hrefs = BUYER_COMMAND_PALETTE_CURATED_TASKS.map((task) => task.href);

    expect(hrefs).toContain(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`);
    expect(hrefs.some((h) => h.includes("/compare?"))).toBe(true);
    expect(hrefs.some((h) => h.includes(`/governance?runId=`))).toBe(true);
    expect(hrefs).toContain("/governance/findings");
    expect(hrefs.some((h) => h.includes(`/audit?runId=`))).toBe(true);
  });
});
