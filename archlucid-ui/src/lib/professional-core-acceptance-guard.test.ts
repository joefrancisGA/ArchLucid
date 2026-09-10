import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PROFESSIONAL_CORE_ACCEPTANCE_CASES,
  PROFESSIONAL_CORE_ACCEPTANCE_DOC_RELATIVE_PATH,
} from "@/lib/professional-core-acceptance-inventory";

const UI_SRC_ROOT = join(process.cwd(), "src");
const REPO_ROOT = join(process.cwd(), "..");

describe("professional-core acceptance guard (wave 15 close)", () => {
  it("records the wave-close acceptance audit document", () => {
    const docPath = join(REPO_ROOT, PROFESSIONAL_CORE_ACCEPTANCE_DOC_RELATIVE_PATH);

    expect(existsSync(docPath), PROFESSIONAL_CORE_ACCEPTANCE_DOC_RELATIVE_PATH).toBe(true);
  });

  it.each(PROFESSIONAL_CORE_ACCEPTANCE_CASES.map((caseRow) => [caseRow.id, caseRow] as const))(
    "%s keeps its canonical Vitest evidence file",
    (id, caseRow) => {
      const absolutePath = join(UI_SRC_ROOT, caseRow.relativeTestPath);

      expect(existsSync(absolutePath), `${id} missing ${caseRow.relativeTestPath}`).toBe(true);

      const contents = readFileSync(absolutePath, "utf8");

      expect(contents).toContain(caseRow.marker);
    },
  );
});
