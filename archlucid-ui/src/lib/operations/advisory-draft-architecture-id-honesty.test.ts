import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd());

describe("advisory-draft-in-flight architectureId honesty (PC-07)", () => {
  it("does not assign draftId to architectureId when tracking advisory draft work", () => {
    const source = readFileSync(
      join(UI_ROOT, "src/lib/operations/advisory-draft-in-flight.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/architectureId:\s*draftId/);
    expect(source).toContain("architectureId: architectureId !== null");
  });
});
