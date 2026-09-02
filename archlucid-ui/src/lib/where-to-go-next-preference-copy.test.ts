import { describe, expect, it } from "vitest";

import { PREFERENCES_WHERE_TO_GO_NEXT_HEADING } from "@/lib/where-to-go-next-preference-copy";

describe("where-to-go-next preference copy", () => {
  it("uses Follow-up link strips as the preferences card heading", () => {
    expect(PREFERENCES_WHERE_TO_GO_NEXT_HEADING).toBe("Follow-up link strips");
  });
});
