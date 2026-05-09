import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { AxeResults } from "axe-core";

export interface A11yCheckOptions {
  disableRules?: string[];
  include?: string;
}

async function runAxeOnce(page: Page, options?: A11yCheckOptions): Promise<AxeResults> {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
    "best-practice",
  ]);

  if (options?.disableRules?.length) {
    builder = builder.disableRules(options.disableRules);
  }

  if (options?.include) {
    builder = builder.include(options.include);
  }

  return builder.analyze();
}

/**
 * SPA redirects / RSC hydration can navigate while {@link AxeBuilder.analyze} runs `page.evaluate`,
 * destroying the execution context. Retry once the shell is visible again.
 */
export async function runAxe(page: Page, options?: A11yCheckOptions): Promise<AxeResults> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runAxeOnce(page, options);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      const transientNavigation =
        message.includes("Execution context was destroyed") ||
        message.includes("Target closed") ||
        message.includes("most likely because of a navigation");

      if (!transientNavigation || attempt === maxAttempts) throw error;

      await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });
    }
  }

  throw new Error("runAxe: unreachable");
}

export function formatViolations(violations: AxeResults["violations"]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `    ${n.html}`).join("\n");

      return `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${nodes}`;
    })
    .join("\n\n");
}
