export type AccessibilityRevisionEntry = {
  readonly documentVersion: string;
  readonly effectiveDate: string;
  readonly summary: string;
};

/** Published revision log for the public accessibility statement. */
export const ACCESSIBILITY_REVISION_HISTORY: readonly AccessibilityRevisionEntry[] = [
  {
    documentVersion: "2026-08-15",
    effectiveDate: "2026-08-15",
    summary:
      "Moved evaluation orientation below the statement, added at-a-glance summary, skip link, header report CTA, and revision history.",
  },
  {
    documentVersion: "2026-08-10",
    effectiveDate: "2026-08-10",
    summary: "Initial public WCAG 2.1 Level AA accessibility statement for archlucid.net.",
  },
] as const;
