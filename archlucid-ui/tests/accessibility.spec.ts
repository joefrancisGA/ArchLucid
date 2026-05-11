import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";
import { expect, test } from "@playwright/test";

/**
 * WCAG 2.1 Level A + AA rules (includes 2.0 A/AA where tagged in axe-rule-metadata).
 */
const wcag21LevelAaTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

/**
 * Operator routes exercised under mock API + demo static fallback (see `playwright.mock.config.ts`).
 * There is no `/settings` index; tenant settings represent the primary settings hub.
 */
const operatorAccessibilityRoutes = [
  { path: "/", label: "operator home" },
  { path: "/runs", label: "runs" },
  { path: "/compare", label: "compare" },
  { path: "/settings/tenant", label: "tenant settings" },
] as const;

function summarizeViolations(violations: Result[]): string {

  return violations
    .map((v: Result) => {
      const nodeSummary = v.nodes.slice(0, 3).map((n: { html: string }) => n.html).join("; ");

      return `${v.id} (${v.impact ?? "unknown"}): ${v.help} — instances: ${v.nodes.length}; sample HTML: ${nodeSummary}`;
    })
    .join("\n---\n");
}

test.describe("Accessibility (axe-core, WCAG 2.1 A + AA)", () => {

  for (const route of operatorAccessibilityRoutes) {

    test(`${route.label} (${route.path})`, async ({ page }, testInfo) => {
      await page.goto(route.path, { waitUntil: "load" });

      const results = await new AxeBuilder({ page })
        .withTags([...wcag21LevelAaTags])
        .analyze();

      const violations = results.violations;

      if (violations.length > 0) {

        await testInfo.attach(`${route.label}-axe-violations.json`, {
          body: JSON.stringify(violations, undefined, 2),
          contentType: "application/json",
        });

        await testInfo.attach(`${route.label}-axe-report.txt`, {
          body: summarizeViolations(violations),
          contentType: "text/plain",
        });
      }

      expect(
        violations,
        `WCAG 2.1 A/AA axe violations on ${route.path}:\n${summarizeViolations(violations)}`,
      ).toEqual([]);
    });
  }
});
