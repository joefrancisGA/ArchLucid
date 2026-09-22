import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_OUTBOUND_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_OUTBOUND_ROWS,
} from "@/lib/career-gravity-outbound-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity outbound inventory (CG-006)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_OUTBOUND_INVENTORY_DOC_PATH), "utf8");

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/Do not change payloads/);
    expect(markdown).toMatch(/ExecDigestComposition/);
    expect(markdown).toMatch(/itsm\/outbound\/issues/);

    for (const row of CAREER_GRAVITY_OUTBOUND_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_OUTBOUND_ROWS) {
      expect(existsSync(join(REPO_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }
  });

  it("keeps digest composition without a structural Mode field", () => {
    const composition = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/ExecDigest/ExecDigestComposition.cs"),
      "utf8",
    );

    expect(composition).toMatch(/record ExecDigestComposition/);
    expect(composition).not.toMatch(/StructuralExecutionMode/);
    expect(composition).not.toMatch(/WorkingCareerRehearsal/);
  });
});
