import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_AS076_INDEXED_INVENTORY_DOCS,
  CAREER_GRAVITY_AS076_LEFTOVER_MATRIX_DOC_PATH,
  CAREER_GRAVITY_AS076_MATRIX_ROWS,
} from "@/lib/career-gravity-as076-leftover-matrix";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity AS-076 leftover matrix (CG-010)", () => {
  it("documents the shipped AS-076–085 matrix and forbids re-running the chooser", () => {
    const markdown = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_AS076_LEFTOVER_MATRIX_DOC_PATH), "utf8");

    expect(markdown).toMatch(/Do not re-run AS-076–085/);
    expect(markdown).toMatch(/Do not re-run AS-077/);
    expect(markdown).toMatch(/G-REAL-06/);
    expect(markdown).toMatch(/AgentExecution:Mode/);

    for (const row of CAREER_GRAVITY_AS076_MATRIX_ROWS) {
      expect(markdown).toContain("`" + row.promptRelativePath + "`");
      expect(markdown).toContain(row.leftoverPrompt);
    }
  });

  it("lists existing AS prompt files, leftover inventories, and all ten AS ids", () => {
    const ids = CAREER_GRAVITY_AS076_MATRIX_ROWS.map((row) => row.asId);

    expect(ids).toEqual(["076", "077", "078", "079", "080", "081", "082", "083", "084", "085"]);

    for (const row of CAREER_GRAVITY_AS076_MATRIX_ROWS) {
      expect(existsSync(join(REPO_ROOT, row.promptRelativePath)), row.promptRelativePath).toBe(true);
    }

    for (const doc of CAREER_GRAVITY_AS076_INDEXED_INVENTORY_DOCS) {
      expect(existsSync(join(REPO_ROOT, doc)), doc).toBe(true);
    }
  });
});
