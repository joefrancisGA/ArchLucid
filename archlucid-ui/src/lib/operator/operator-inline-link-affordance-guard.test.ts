import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_INLINE_LINK_AFFORDANCE_BASELINE } from "@/lib/operator/operator-inline-link-affordance-baseline";
import {
  collectOperatorInlineLinkAffordanceViolationsUnderSrc,
  formatOperatorInlineLinkAffordanceViolationKey,
  findOperatorInlineLinkAffordanceViolations,
  hasOperatorInlineLinkAffordance,
  isOperatorInlineLinkAffordanceExempt,
} from "@/lib/operator/operator-inline-link-affordance-patterns";
import { OPERATOR_INLINE_LINK_TB1674_MIGRATED_SURFACES } from "@/lib/operator/operator-inline-link-tb1674-surfaces";

const SRC_ROOT = join(process.cwd(), "src");

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

const REMEDIATION =
  "Navigational <Link>/<a> must use OPERATOR_LINK, text-al-link, underline, MARKETING_SURFACES.inlineLink, workflow-inline-link, shell-nav-link, or Button asChild chrome (TB-1671 / TB-1675).";

describe("operator-inline-link-affordance guard (TB-1675)", () => {
  it("parses multiline Link tags with comparison operators in href expressions", () => {
    const source = `
      <Link
        href={policyPacksEditHref(packId.length > 0 ? packId : labelSource ?? "")}
        className={cn(OPERATOR_LINK.inline, props.className)}
      >
        Pack
      </Link>
    `;
    const violations = findOperatorInlineLinkAffordanceViolations(source, "example.tsx");

    expect(violations).toEqual([]);
  });
  it("detects bare navigational links without affordance tokens", () => {
    const violations = findOperatorInlineLinkAffordanceViolations(
      '<Link href="/foo">Bar</Link>',
      "example.tsx",
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(1);
  });

  it("allows OPERATOR_LINK and Button asChild anchors", () => {
    const linked = findOperatorInlineLinkAffordanceViolations(
      '<Link href="/foo" className={OPERATOR_LINK.nav}>Bar</Link>',
      "example.tsx",
    );
    const buttonChild = findOperatorInlineLinkAffordanceViolations(
      '<Button asChild><a href="/foo">Bar</a></Button>',
      "example.tsx",
    );

    expect(linked).toHaveLength(0);
    expect(buttonChild).toHaveLength(0);
  });

  it.each(
    OPERATOR_INLINE_LINK_TB1674_MIGRATED_SURFACES.map((entry) => [entry.id, entry.modulePath]),
  )("TB-1674 migrated surface %s has no bare inline-link violations", (_id, modulePath) => {
    const source = readFileSync(join(SRC_ROOT, modulePath), "utf8");
    const violations = findOperatorInlineLinkAffordanceViolations(source, modulePath);

    expect(violations, REMEDIATION).toEqual([]);
  });

  it("matches the grandfathered bare-link baseline exactly", () => {
    const violations = collectOperatorInlineLinkAffordanceViolationsUnderSrc(
      SRC_ROOT,
      (absolutePath) => readFileSync(absolutePath, "utf8"),
      listSourceFiles,
    );
    const keys = [...new Set(violations.map(formatOperatorInlineLinkAffordanceViolationKey))].sort();

    if (process.env.REFRESH_OPERATOR_INLINE_LINK_BASELINE === "1") {
      const body = [
        "/** TB-1675 grandfathered bare navigational Link and a[href] call sites. Shrink when migrating to OPERATOR_LINK. */",
        "export const OPERATOR_INLINE_LINK_AFFORDANCE_BASELINE: readonly string[] = [",
        ...keys.map((key) => `  "${key}",`),
        "] as const;",
        "",
      ].join("\n");
      writeFileSync(join(SRC_ROOT, "lib/operator/operator-inline-link-affordance-baseline.ts"), body, "utf8");
    }

    expect(keys, REMEDIATION).toEqual([...OPERATOR_INLINE_LINK_AFFORDANCE_BASELINE].sort());
  });
});

describe("operator-inline-link-affordance patterns (unit)", () => {
  it("treats underline and text-al-link as affordance", () => {
    expect(hasOperatorInlineLinkAffordance('<Link className="text-al-link hover:underline" href="/x">')).toBe(true);
    expect(hasOperatorInlineLinkAffordance('<a className="font-medium underline" href="/x">')).toBe(true);
  });

  it("exempts anchors without navigational href", () => {
    expect(isOperatorInlineLinkAffordanceExempt("<a>", "")).toBe(true);
  });
});
