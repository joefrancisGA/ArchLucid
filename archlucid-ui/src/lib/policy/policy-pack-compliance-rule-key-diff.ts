export type ComplianceRuleKeyDiffItem = {
  readonly key: string;
  readonly changeType: "added" | "removed" | "unchanged";
};

function normalizeComplianceRuleKeys(keys: readonly string[]): string[] {
  const normalized: string[] = [];

  for (const key of keys) {
    const trimmed = key.trim();

    if (trimmed.length === 0) {
      continue;
    }

    normalized.push(trimmed);
  }

  return [...new Set(normalized)].sort((left, right) => left.localeCompare(right));
}

/**
 * Symmetric diff of two complianceRuleKey sets for policy impact preview (before/after assignment).
 */
export function diffComplianceRuleKeys(
  beforeKeys: readonly string[],
  afterKeys: readonly string[],
): ComplianceRuleKeyDiffItem[] {
  const beforeSet = new Set(normalizeComplianceRuleKeys(beforeKeys));
  const afterSet = new Set(normalizeComplianceRuleKeys(afterKeys));
  const allKeys = [...new Set([...beforeSet, ...afterSet])].sort((left, right) => left.localeCompare(right));
  const items: ComplianceRuleKeyDiffItem[] = [];

  for (const key of allKeys) {
    const inBefore = beforeSet.has(key);
    const inAfter = afterSet.has(key);

    if (inBefore && inAfter) {
      items.push({ key, changeType: "unchanged" });
      continue;
    }

    if (inAfter) {
      items.push({ key, changeType: "added" });
      continue;
    }

    items.push({ key, changeType: "removed" });
  }

  return items;
}

/** Union merge used when previewing an additional pack assignment on top of current effective keys. */
export function mergeComplianceRuleKeySets(
  baselineKeys: readonly string[],
  additionalKeys: readonly string[],
): string[] {
  return normalizeComplianceRuleKeys([...baselineKeys, ...additionalKeys]);
}
