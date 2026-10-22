import type { AccessibilityRevisionEntry } from "@/lib/accessibility-marketing-revision-history";
import { ACCESSIBILITY_PUBLIC_LAYOUT } from "@/lib/accessibility-public-layout";

export type AccessibilityRevisionHistoryProps = {
  readonly entries: readonly AccessibilityRevisionEntry[];
};

/** Published revision log for procurement reviewers. */
export function AccessibilityRevisionHistory(props: AccessibilityRevisionHistoryProps): React.JSX.Element | null {
  if (props.entries.length === 0) {
    return null;
  }

  return (
    <section
      className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionSection}
      aria-labelledby="accessibility-revision-history-heading"
      data-testid="accessibility-revision-history"
    >
      <h2 id="accessibility-revision-history-heading" className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionTitle}>
        Revision history
      </h2>
      <p className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionNote}>
        Prior versions are retained for compliance review. Material changes also update the last reviewed date in the header.
      </p>
      <ol className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionList}>
        {props.entries.map((entry) => (
          <li key={entry.documentVersion} className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionItem}>
            <p className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionItemMeta}>
              <span className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionItemDate}>Effective {entry.effectiveDate}</span>
              <span className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionItemVersion}>Version {entry.documentVersion}</span>
            </p>
            <p className={ACCESSIBILITY_PUBLIC_LAYOUT.revisionItemSummary}>{entry.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
