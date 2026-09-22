import { describe, expect, it } from "vitest";

import {
  LOST_WRITE_DEMO_DRAFT_HOST_USES_SAME_CAS_GUARD,
  LOST_WRITE_WORKING_DEMO_DRAFT_LWW_LABEL,
} from "@/lib/lost-write-demo-draft-cas-honesty";

describe("lost-write demo draft CAS honesty (LW-027)", () => {
  it("does not label Working as last-write-wins while the in-memory host uses the same guard", () => {
    expect(LOST_WRITE_DEMO_DRAFT_HOST_USES_SAME_CAS_GUARD).toBe(true);
    expect(LOST_WRITE_WORKING_DEMO_DRAFT_LWW_LABEL).toBeNull();
  });
});
