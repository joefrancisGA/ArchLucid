import type { PrivacyPolicyRevisionEntry } from "@/lib/privacy-policy-content";
import { PRIVACY_POLICY_LAYOUT } from "@/lib/privacy-policy-layout";

export type PrivacyPolicyRevisionHistoryProps = {
  readonly entries: readonly PrivacyPolicyRevisionEntry[];
};

/** Published revision log for procurement and compliance reviewers. */
export function PrivacyPolicyRevisionHistory(props: PrivacyPolicyRevisionHistoryProps): React.JSX.Element | null {
  if (props.entries.length === 0) {
    return null;
  }

  return (
    <section
      className={PRIVACY_POLICY_LAYOUT.revisionSection}
      aria-labelledby="privacy-policy-revision-history-heading"
      data-testid="privacy-policy-revision-history"
    >
      <h2 id="privacy-policy-revision-history-heading" className={PRIVACY_POLICY_LAYOUT.revisionTitle}>
        Revision history
      </h2>
      <p className={PRIVACY_POLICY_LAYOUT.revisionNote}>
        Prior versions are retained for compliance review. Material changes also update the effective date in the header.
      </p>
      <ol className={PRIVACY_POLICY_LAYOUT.revisionList}>
        {props.entries.map((entry) => (
          <li key={entry.documentVersion} className={PRIVACY_POLICY_LAYOUT.revisionItem}>
            <p className={PRIVACY_POLICY_LAYOUT.revisionItemMeta}>
              <span className={PRIVACY_POLICY_LAYOUT.revisionItemDate}>Effective {entry.effectiveDate}</span>
              <span className={PRIVACY_POLICY_LAYOUT.revisionItemVersion}>Version {entry.documentVersion}</span>
            </p>
            <p className={PRIVACY_POLICY_LAYOUT.revisionItemSummary}>{entry.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
