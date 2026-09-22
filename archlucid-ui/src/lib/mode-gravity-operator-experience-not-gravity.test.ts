import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_OPERATOR_EXPERIENCE_ADR_CITATION,
  MODE_GRAVITY_OPERATOR_EXPERIENCE_DOC_RELATIVE_PATH,
  MODE_GRAVITY_OPERATOR_EXPERIENCE_NOT_GRAVITY_LINE,
} from "@/lib/mode-gravity-operator-experience-not-gravity";

const REPO_ROOT = join(process.cwd(), "..");

describe("mode-gravity operator-experience not gravity (MG-004)", () => {
  it("documents density vs gravity in OPERATOR_UI_EXPERIENCE_MODES", () => {
    const doc = readFileSync(join(REPO_ROOT, MODE_GRAVITY_OPERATOR_EXPERIENCE_DOC_RELATIVE_PATH), "utf8");

    expect(MODE_GRAVITY_OPERATOR_EXPERIENCE_NOT_GRAVITY_LINE).toContain("density");
    expect(MODE_GRAVITY_OPERATOR_EXPERIENCE_ADR_CITATION).toBe("0094");
    expect(doc).toContain("0094");
    expect(doc).toMatch(/density/i);
    expect(doc).toMatch(/gravity/i);
    expect(doc).not.toMatch(/operator-experience.*Career door/i);
  });
});
