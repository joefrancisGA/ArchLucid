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

describe("SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE remediation factory metrics", () => {
  it("documents executive measurement honesty and SA-11 headline definitions in help", () => {
    const markdown = readFileSync(guidePath, "utf8");
    const measurementSection = markdown.slice(markdown.indexOf("## How these counts are measured"));

    expect(measurementSection).toContain("{#how-these-counts-are-measured}");
    expect(measurementSection).toContain("IE15-priority-v1");
    expect(measurementSection).toContain("not cloud spend");
    expect(measurementSection).toContain("## Architect outcome metrics (SA-11)");
    expect(measurementSection).toContain("SA11-metrics-v1");
    expect(measurementSection).toContain("Critical/high paths removed");
    expect(measurementSection).toContain("Crown jewel exposure paths removed");
  });
});
