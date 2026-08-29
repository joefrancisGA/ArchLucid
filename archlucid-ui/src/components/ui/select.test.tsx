import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const selectSource = readFileSync(join(__dirname, "select.tsx"), "utf8");

describe("SelectTrigger typography (TB-2290)", () => {
  it("uses compact native control label scale on the trigger, not body or Button label", () => {
    const triggerBlock = selectSource.match(/const SelectTrigger[\s\S]*?SelectTrigger\.displayName/);

    expect(triggerBlock).not.toBeNull();
    expect(triggerBlock![0]).toContain("OPERATOR_TYPOGRAPHY.nativeControlLabel");
    expect(triggerBlock![0]).not.toContain("OPERATOR_TYPOGRAPHY.body");
    expect(triggerBlock![0]).not.toContain("OPERATOR_TYPOGRAPHY.button");
  });
});
