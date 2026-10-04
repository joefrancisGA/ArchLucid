import { describe, expect, it } from "vitest";

import { formatPolicyPacksEffectiveLayerCount } from "@/lib/policy/policy-packs-effective-layer-count-display";

describe("formatPolicyPacksEffectiveLayerCount", () => {
  it("returns Not loaded when effective set is null", () => {
    expect(formatPolicyPacksEffectiveLayerCount(null)).toBe("Not loaded");
  });

  it("returns zero for an empty resolved set", () => {
    expect(formatPolicyPacksEffectiveLayerCount({ packs: [] } as never)).toBe("0");
  });
});
