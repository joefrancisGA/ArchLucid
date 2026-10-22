import { describe, expect, it } from "vitest";

import {
  OPERATOR_ATTENTION_KIND_LABELS,
  OPERATOR_ATTENTION_SURFACE_KIND_MAP,
  operatorAttentionSurfaceInventory,
} from "@/lib/operator/operator-attention-taxonomy";

describe("operator-attention-taxonomy (TB-2353)", () => {
  it("maps every inventoried surface to one of four kind labels", () => {
    const inventory = operatorAttentionSurfaceInventory();
    const surfaces = Object.keys(OPERATOR_ATTENTION_SURFACE_KIND_MAP);

    expect(inventory.length).toBe(surfaces.length);

    for (const row of inventory) {
      expect(OPERATOR_ATTENTION_KIND_LABELS[row.kind]).toBe(row.kindLabel);
    }
  });

  it("uses Unfinished work for the unfinished-work rail", () => {
    expect(OPERATOR_ATTENTION_SURFACE_KIND_MAP["unfinished-work-rail"]).toBe("unfinished-work");
    expect(OPERATOR_ATTENTION_KIND_LABELS["unfinished-work"]).toBe("Unfinished work");
  });
});
