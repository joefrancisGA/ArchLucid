import Link from "next/link";

import type { PrivacyPolicyRelatedDocument } from "@/lib/privacy-policy-content";
import { PRIVACY_POLICY_LAYOUT } from "@/lib/privacy-policy-layout";
import { cn } from "@/lib/utils";

export type PrivacyPolicyRelatedDocumentsProps = {
  readonly documents: readonly PrivacyPolicyRelatedDocument[];
};

/** Curated links to trust and privacy materials referenced by the policy. */
export function PrivacyPolicyRelatedDocuments(props: PrivacyPolicyRelatedDocumentsProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="privacy-policy-related-documents-heading"
      className={PRIVACY_POLICY_LAYOUT.relatedSection}
      data-testid="privacy-policy-related-documents"
    >
      <h2 id="privacy-policy-related-documents-heading" className={PRIVACY_POLICY_LAYOUT.relatedTitle}>
        Related privacy and trust documents
      </h2>
      <ul className={PRIVACY_POLICY_LAYOUT.relatedList}>
        {props.documents.map((document) => (
          <li key={`${document.title}-${document.href}`}>
            <Link href={document.href} className={cn(PRIVACY_POLICY_LAYOUT.relatedCard, "block no-underline")}>
              <p className={PRIVACY_POLICY_LAYOUT.relatedCardTitle}>{document.title}</p>
              <p className={PRIVACY_POLICY_LAYOUT.relatedCardPurpose}>{document.purpose}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
