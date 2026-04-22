/**
 * Dumps parsed `ACCESSIBILITY.md` sections for CI (`assert_marketing_accessibility_in_sync.py`).
 * Prints JSON only to stdout (no logs).
 */
import {
  ACCESSIBILITY_MARKETING_SYNC_SECTION_TITLES,
  parseAccessibilityMarkdownSections,
  parseLastReviewedLine,
  readAccessibilityPolicyMarkdown,
} from "../src/lib/accessibility-marketing-policy";

function main(): void {
  const markdown = readAccessibilityPolicyMarkdown();
  const sections = parseAccessibilityMarkdownSections(markdown);
  const payload: Record<string, unknown> = {
    titles: [...ACCESSIBILITY_MARKETING_SYNC_SECTION_TITLES],
    sections: Object.fromEntries(
      ACCESSIBILITY_MARKETING_SYNC_SECTION_TITLES.map((t) => [t, sections.get(t) ?? ""]),
    ),
    lastReviewedLine: parseLastReviewedLine(markdown),
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

main();
