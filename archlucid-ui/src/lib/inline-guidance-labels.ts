/** Canonical inline guidance prefixes — longest match first for parsing. */
export const INLINE_GUIDANCE_LABELS = [
  "What to do next:",
  "Evidence expected:",
  "Before you continue:",
  "Success signal:",
  "Why this matters:",
  "Use this when:",
  "What this means:",
  "Good to know:",
  "Last reviewed:",
  "Recommended:",
  "Important:",
  "After this:",
  "Optional:",
  "Required:",
  "Audience:",
  "Sidebar:",
  "Warning:",
  "Example:",
  "Project:",
  "Status:",
  "Scope:",
  "Next:",
  "Note:",
  "Tip:",
] as const;

export type InlineGuidanceLabelText = (typeof INLINE_GUIDANCE_LABELS)[number];

export type ParsedInlineGuidanceLabel = {
  readonly label: InlineGuidanceLabelText | string;
  readonly body: string;
};

/**
 * When copy starts with a known guidance label, split label from body for emphasized rendering.
 */
export function parseLeadingInlineGuidanceLabel(text: string): ParsedInlineGuidanceLabel | null {
  const trimmed = text.trimStart();

  for (const label of INLINE_GUIDANCE_LABELS) {
    if (!trimmed.startsWith(label)) {
      continue;
    }

    return {
      label,
      body: trimmed.slice(label.length).trimStart(),
    };
  }

  return null;
}
