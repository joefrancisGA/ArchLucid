const POLICY_PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9._-]+)\s*\}\}/g;

/** Returns unresolved policy placeholders in stable document order. */
export function findPolicyPackPlaceholders(contentJson: string): readonly string[] {
  const placeholders: string[] = [];
  const seen = new Set<string>();

  for (const match of contentJson.matchAll(POLICY_PLACEHOLDER_PATTERN)) {
    const placeholder = match[1]?.trim();

    if (placeholder === undefined || placeholder.length === 0 || seen.has(placeholder)) {
      continue;
    }

    seen.add(placeholder);
    placeholders.push(placeholder);
  }

  return placeholders;
}

/** Formats the inline validation message for unresolved organization policy values. */
export function policyPackPlaceholderValidationMessage(placeholders: readonly string[]): string {
  return `Fill in required policy values: ${placeholders.map((placeholder) => `{{${placeholder}}}`).join(", ")}.`;
}
