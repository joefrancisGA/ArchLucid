import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LIVE_DEMO_PAGE_TITLE } from "@/lib/live-demo-page-copy";
import {
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_HREF,
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF,
} from "@/lib/live-demo-see-it-ladder-copy";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1428: repo guard that public proof ladder copy stays honest after TB-1265/TB-1267. */
describe("live-demo see-it ladder honesty guard (TB-1428)", () => {
  it("keeps honest guided sample walkthrough title off Live demo", () => {
    expect(LIVE_DEMO_PAGE_TITLE).toBe("Guided sample walkthrough");
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).not.toBe("live demo");
  });

  it("wires see-it and live-demo ladder hrefs", () => {
    expect(LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF).toBe("/see-it");
    expect(LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_HREF).toBe("/live-demo");
  });

  it("documents the python ladder honesty guard in the engineering contract", () => {
    const contract = readFileSync(
      join(REPO_ROOT, "docs/library/LIVE_DEMO_SEE_IT_LADDER_HONESTY.md"),
      "utf8",
    );

    expect(contract).toContain("check_live_demo_see_it_ladder_honesty.py");
    expect(contract).toContain("**TB-1428**");
  });
});
