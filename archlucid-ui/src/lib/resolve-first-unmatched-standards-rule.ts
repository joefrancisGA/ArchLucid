import type { StandardsRuleRow } from "@/lib/standards-rules-rows";

/** First standards rule without linked findings in table order. */
export function resolveFirstUnmatchedStandardsRule(
  rows: readonly StandardsRuleRow[],
): StandardsRuleRow | null {
  return rows.find((row) => row.linkedFindingsHref === null) ?? null;
}
