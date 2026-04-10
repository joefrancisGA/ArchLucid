import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import type { AxeResults } from "axe-core";

export interface A11yCheckOptions {
  disableRules?: string[];
  include?: string;
}

export async function runAxe(page: Page, options?: A11yCheckOptions): Promise<AxeResults> {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]);

  if (options?.disableRules?.length) {
    builder = builder.disableRules(options.disableRules);
  }

  if (options?.include) {
    builder = builder.include(options.include);
  }

  return builder.analyze();
}

export function formatViolations(violations: AxeResults["violations"]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `    ${n.html}`).join("\n");

      return `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${nodes}`;
    })
    .join("\n\n");
}
