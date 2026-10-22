import type { TrustCenterRevisionEntry } from "@/lib/trust-center-marketing-revision-history";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

export type TrustCenterRevisionHistoryProps = {
  readonly entries: readonly TrustCenterRevisionEntry[];
};

/** Published revision log for procurement reviewers. */
export function TrustCenterRevisionHistory(props: TrustCenterRevisionHistoryProps): React.JSX.Element | null {
  if (props.entries.length === 0) {
    return null;
  }

  return (
    <section
      className={TRUST_CENTER_PUBLIC_LAYOUT.revisionSection}
      aria-labelledby="trust-center-revision-history-heading"
      data-testid="trust-center-revision-history"
    >
      <h2 id="trust-center-revision-history-heading" className={TRUST_CENTER_PUBLIC_LAYOUT.revisionTitle}>
        Revision history
      </h2>
      <p className={TRUST_CENTER_PUBLIC_LAYOUT.revisionNote}>
        Prior evidence-pack versions are retained for compliance review. Material changes also update the last reviewed date in the header.
      </p>
      <ol className={TRUST_CENTER_PUBLIC_LAYOUT.revisionList}>
        {props.entries.map((entry) => (
          <li key={entry.documentVersion} className={TRUST_CENTER_PUBLIC_LAYOUT.revisionItem}>
            <p className={TRUST_CENTER_PUBLIC_LAYOUT.revisionItemMeta}>
              <span className={TRUST_CENTER_PUBLIC_LAYOUT.revisionItemDate}>Effective {entry.effectiveDate}</span>
              <span className={TRUST_CENTER_PUBLIC_LAYOUT.revisionItemVersion}>Version {entry.documentVersion}</span>
            </p>
            <p className={TRUST_CENTER_PUBLIC_LAYOUT.revisionItemSummary}>{entry.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
