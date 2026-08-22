/** Canonical inline guidance prefixes — longest match first for parsing. */
export const INLINE_GUIDANCE_LABELS = [
  "Quick start:",
  "Start with a sample:",
  "What you can do here:",
  "Review and evidence trail:",
  "What happens next:",
  "What to do next:",
  "Evidence expected:",
  "Before you continue:",
  "Success signal:",
  "Why this matters:",
  "Use this when:",
  "What this means:",
  "Optional setup:",
  "Setup readiness:",
  "Sample includes:",
  "Recommended action:",
  "Good to know:",
  "Last reviewed:",
  "Recommended:",
  "Important:",
  "After this:",
  "Next action:",
  "Next step:",
  "Skip for now:",
  "Blocked by:",
  "Optional:",
  "Required:",
  "Audience:",
  "Sidebar:",
  "Warning:",
  "Example:",
  "Project:",
  "Quick path:",
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

/** Label-style prefixes that introduce imperative UI guidance — capitalize the first word after the colon. */
const LABEL_STYLE_INLINE_GUIDANCE_PREFIXES = new Set<string>([
  "Before you continue:",
  "Recommended action:",
  "Optional setup:",
  "Good to know:",
  "Skip for now:",
  "Blocked by:",
  "Optional:",
  "Recommended:",
  "Important:",
  "Warning:",
  "Required:",
  "Note:",
  "Tip:",
]);

function normalizeInlineGuidanceLabel(label: string): string {
  return label.endsWith(":") ? label : `${label}:`;
}

/** True when the prefix should render with a capitalized first word in the body. */
export function shouldCapitalizeInlineGuidanceBody(label: string): boolean {
  return LABEL_STYLE_INLINE_GUIDANCE_PREFIXES.has(normalizeInlineGuidanceLabel(label));
}

/** Capitalize the first character of inline guidance body copy when the label is label-style. */
export function capitalizeInlineGuidanceBody(label: string, body: string): string {
  if (!shouldCapitalizeInlineGuidanceBody(label) || body.length === 0) {
    return body;
  }

  return body.charAt(0).toUpperCase() + body.slice(1);
}

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
