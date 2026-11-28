import { describe, expect, it } from "vitest";

import {
  SECURENOW_CUTTING_EDGE_ASK_BOUNDED_LINE,
  SECURENOW_CUTTING_EDGE_NOT_FRONTIER_LINE,
} from "@/lib/product-line/securenow-cutting-edge-substrate-copy";
import { SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE } from "@/lib/product-line/securenow-path-inspect-copy";

describe("score lift round152 wave H3 honesty", () => {
  it("states stored rank discipline and denies frontier retraining", () => {
    expect(SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE).toContain("rank weights are unchanged");
    expect(SECURENOW_CUTTING_EDGE_ASK_BOUNDED_LINE).toContain("stored path bundle");
    expect(SECURENOW_CUTTING_EDGE_NOT_FRONTIER_LINE).toContain("not retrained");
  });
});
