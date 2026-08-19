/**
 * Dumps `ACCESSIBILITY.md` review metadata for CI (`assert_marketing_accessibility_in_sync.py`).
 * Prints JSON only to stdout (no logs).
 */
import { parseLastReviewedLine, readAccessibilityPolicyMarkdown } from "../src/lib/accessibility-marketing-policy";

function main(): void {
  const markdown = readAccessibilityPolicyMarkdown();
  const payload: Record<string, unknown> = {
    lastReviewedLine: parseLastReviewedLine(markdown),
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

main();
