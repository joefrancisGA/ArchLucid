import { describe, expect, it } from "vitest";

import { OperateArchitectAdvancedNavGroupBuilder } from "@/lib/operate-architect-advanced-nav-group-builder";

describe("OperateArchitectAdvancedNavGroupBuilder", () => {
  it("uses Programs group label (TB-647)", () => {
    const group = new OperateArchitectAdvancedNavGroupBuilder().build();

    expect(group.id).toBe("operate-architect-advanced");
    expect(group.label).toBe("Programs");
    expect(group.surface).toBe("review-workflow");
  });
});
