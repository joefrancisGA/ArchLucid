import { describe, expect, it } from "vitest";

import { LIVE_DEMO_PAGE_TITLE } from "@/lib/live-demo-page-copy";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";

import {
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_HREF,
  LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_LINK,
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF,
  LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK,
} from "./live-demo-see-it-ladder-copy";

describe("live-demo-see-it-ladder-copy (TB-1267)", () => {
  it("uses distinct rung labels for see-it and live-demo", () => {
    expect(LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK.toLowerCase()).toContain("30-second");
    expect(LIVE_DEMO_SEE_IT_LADDER_SEE_IT_LINK).toContain(SEE_IT_PAGE_TITLE);
    expect(LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_LINK.toLowerCase()).toContain("guided");
    expect(LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_LINK).not.toContain(SEE_IT_PAGE_TITLE);
    expect(LIVE_DEMO_PAGE_TITLE.toLowerCase()).toContain("walkthrough");
  });

  it("pins canonical ladder hrefs", () => {
    expect(LIVE_DEMO_SEE_IT_LADDER_SEE_IT_HREF).toBe("/see-it");
    expect(LIVE_DEMO_SEE_IT_LADDER_LIVE_DEMO_HREF).toBe("/live-demo");
  });
});
