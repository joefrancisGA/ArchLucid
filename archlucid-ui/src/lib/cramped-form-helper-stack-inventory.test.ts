import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CRAMPED_FORM_HELPER_APPLIED_SOURCE_ROOTS,
  CRAMPED_FORM_HELPER_STACK_INVENTORY,
} from "@/lib/cramped-form-helper-stack-inventory";

const UI_ROOT = join(process.cwd());

describe("cramped form helper stack inventory (TB-2004)", () => {
  it("files inventory rows with applied vs deferred dispositions", () => {
    const ids = CRAMPED_FORM_HELPER_STACK_INVENTORY.map((entry) => entry.id);

    expect(ids).toContain("alert-rules-create");
    expect(ids).toContain("policy-pack-nl-builder");
    expect(CRAMPED_FORM_HELPER_STACK_INVENTORY.some((entry) => entry.disposition === "deferred")).toBe(true);
  });

  it("applies TB-2000 stacks on highest-traffic applied surfaces", () => {
    for (const relativePath of CRAMPED_FORM_HELPER_APPLIED_SOURCE_ROOTS) {
      const absolutePath = join(UI_ROOT, "src", relativePath);

      expect(existsSync(absolutePath), relativePath).toBe(true);

      const source = readFileSync(absolutePath, "utf8");

      expect(source).toContain("OPERATOR_FORM_FIELD_STACK_CLASS");
      expect(source).toContain("OPERATOR_FORM_FIELD_HELPER_CLASS");
    }
  });
});
