import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_ROUTE_LITERAL_BINDINGS,
  describeCanonicalRouteLiteralViolation,
  findCanonicalRouteLiteralViolations,
} from "@/lib/canonical-route-literal-guard";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

const EVIDENCE_COPY_DIR = "src/lib";

function evidenceCopyFiles(): readonly string[] {
  const root = path.join(process.cwd(), EVIDENCE_COPY_DIR);

  return readdirSync(root)
    .filter((name) => name.endsWith("-evidence-copy.ts"))
    .map((name) => `${EVIDENCE_COPY_DIR}/${name}`);
}

describe("canonical route literal bindings", () => {
  it("bind every route to a non-empty absolute path", () => {
    for (const binding of CANONICAL_ROUTE_LITERAL_BINDINGS) {
      expect(binding.path.startsWith("/"), `${binding.constant} must be an absolute path`).toBe(true);
      expect(binding.constant.length).toBeGreaterThan(0);
      expect(binding.module.startsWith("@/lib/")).toBe(true);
    }
  });

  it("bind each route path exactly once", () => {
    const paths = CANONICAL_ROUTE_LITERAL_BINDINGS.map((binding) => binding.path);

    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("findCanonicalRouteLiteralViolations", () => {
  it("flags a double-quoted canonical route", () => {
    const violations = findCanonicalRouteLiteralViolations(
      "example.ts",
      `const link = { label: "Audit", href: "${GOVERNANCE_AUDIT_PATH}" };`,
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]!.constant).toBe("GOVERNANCE_AUDIT_PATH");
    expect(violations[0]!.line).toBe(1);
  });

  it("flags single-quoted and backtick-quoted routes", () => {
    const single = findCanonicalRouteLiteralViolations("a.ts", `const a = '${GOVERNANCE_AUDIT_PATH}';`);
    const backtick = findCanonicalRouteLiteralViolations("b.ts", `const b = \`${GOVERNANCE_AUDIT_PATH}\`;`);

    expect(single).toHaveLength(1);
    expect(backtick).toHaveLength(1);
  });

  it("reports every canonical route on a single line", () => {
    const violations = findCanonicalRouteLiteralViolations(
      "example.ts",
      `const links = ["${GOVERNANCE_AUDIT_PATH}", "${GOVERNANCE_FINDINGS_PATH}"];`,
    );

    expect(violations.map((violation) => violation.constant)).toEqual([
      "GOVERNANCE_AUDIT_PATH",
      "GOVERNANCE_FINDINGS_PATH",
    ]);
  });

  it("accepts the canonical constant", () => {
    const violations = findCanonicalRouteLiteralViolations(
      "example.ts",
      `const link = { label: "Audit", href: GOVERNANCE_AUDIT_PATH };`,
    );

    expect(violations).toEqual([]);
  });

  it("ignores route mentions inside comments", () => {
    const violations = findCanonicalRouteLiteralViolations(
      "example.ts",
      [
        `/** Operator Sources — no self-href to "${GOVERNANCE_AUDIT_PATH}". */`,
        `// see "${GOVERNANCE_AUDIT_PATH}"`,
        ` * "${GOVERNANCE_AUDIT_PATH}"`,
      ].join("\n"),
    );

    expect(violations).toEqual([]);
  });

  it("ignores longer routes that merely start with a canonical path", () => {
    const violations = findCanonicalRouteLiteralViolations(
      "example.ts",
      `const detail = "${GOVERNANCE_FINDINGS_PATH}/[findingId]";`,
    );

    expect(violations).toEqual([]);
  });

  it("ignores routes carrying a query string", () => {
    const violations = findCanonicalRouteLiteralViolations(
      "example.ts",
      `const tab = "${GOVERNANCE_AUDIT_PATH}?tab=events";`,
    );

    expect(violations).toEqual([]);
  });

  it("returns nothing for empty contents", () => {
    expect(findCanonicalRouteLiteralViolations("example.ts", "")).toEqual([]);
  });

  it("describes a violation with the import to add", () => {
    const [violation] = findCanonicalRouteLiteralViolations(
      "example.ts",
      `const href = "${GOVERNANCE_AUDIT_PATH}";`,
    );

    const message = describeCanonicalRouteLiteralViolation(violation!);

    expect(message).toContain("example.ts:1");
    expect(message).toContain("GOVERNANCE_AUDIT_PATH");
    expect(message).toContain("@/lib/governance/governance-route-paths");
  });
});

describe("evidence-copy modules", () => {
  it("scan a non-empty set of modules", () => {
    expect(evidenceCopyFiles().length).toBeGreaterThan(50);
  });

  it("reference canonical routes through constants, never string literals", () => {
    const violations = evidenceCopyFiles().flatMap((file) =>
      findCanonicalRouteLiteralViolations(file, readFileSync(path.join(process.cwd(), file), "utf8")),
    );

    expect(
      violations,
      violations.map(describeCanonicalRouteLiteralViolation).join("\n"),
    ).toEqual([]);
  });
});
