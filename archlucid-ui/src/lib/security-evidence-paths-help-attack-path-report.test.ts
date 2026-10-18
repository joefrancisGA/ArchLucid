import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const guidePath = join(
  process.cwd(),
  "..",
  "docs",
  "library",
  "customer-facing",
  "SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE.md",
);

describe("SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE attack path report section", () => {
  it("documents both report headings without percentage or product name in the new section", () => {
    const markdown = readFileSync(guidePath, "utf8");
    const section = markdown.slice(markdown.indexOf("## Attack path report"));

    expect(section).toContain("Vulnerable attack paths");
    expect(section).toContain("Could not be fully evaluated");
    expect(section).toContain("Priorities & waves");
    expect(section).not.toMatch(/%/);
    expect(section).not.toMatch(/ArchLucid/i);
  });
});
