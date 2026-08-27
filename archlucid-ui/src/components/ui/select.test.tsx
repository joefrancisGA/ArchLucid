import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const selectSource = readFileSync(join(__dirname, "select.tsx"), "utf8");

describe("SelectTrigger typography (TB-2290)", () => {
  it("uses canonical button label scale on the trigger, not body", () => {
    const triggerBlock = selectSource.match(/const SelectTrigger[\s\S]*?SelectTrigger\.displayName/);

    expect(triggerBlock).not.toBeNull();
    expect(triggerBlock![0]).toContain("OPERATOR_TYPOGRAPHY.button");
    expect(triggerBlock![0]).not.toContain("OPERATOR_TYPOGRAPHY.body");
  });
});
