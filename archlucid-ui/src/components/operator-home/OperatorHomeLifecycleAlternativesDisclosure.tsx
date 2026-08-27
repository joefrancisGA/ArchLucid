"use client";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import {
  OPERATOR_HOME_LIFECYCLE_ALTERNATIVES_COLLAPSED_SUMMARY,
  OPERATOR_HOME_LIFECYCLE_ALTERNATIVES_DISCLOSURE_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import type { OperatorHomeLifecyclePath } from "@/lib/resolve-operator-home-workspace-phase";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";

type OperatorHomeLifecycleAlternativesDisclosureProps = {
  readonly emphasizedPath: OperatorHomeLifecyclePath | null;
  readonly pagePrimaryOwnedElsewhere?: boolean;
  readonly hideExplorePath?: boolean;
};

/**
 * Lifecycle entry cards — prominent on empty Home, collapsed when a resume/draft primary
 * already owns the first viewport (TB-1539 first-viewport budget).
 */
export function OperatorHomeLifecycleAlternativesDisclosure(
  props: OperatorHomeLifecycleAlternativesDisclosureProps,
): React.JSX.Element {
  const pagePrimaryOwnedElsewhere = props.pagePrimaryOwnedElsewhere === true;

  const dualPathCards = (
    <OperatorHomeDualPathCards
      emphasizedPath={props.emphasizedPath}
      pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
      hideExplorePath={props.hideExplorePath}
    />
  );

  if (!pagePrimaryOwnedElsewhere) {
    return dualPathCards;
  }

  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_LIFECYCLE_ALTERNATIVES_DISCLOSURE_TITLE}
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.lifecycleAlternatives}
      defaultExpanded={false}
      density="slim"
      collapsedSummary={OPERATOR_HOME_LIFECYCLE_ALTERNATIVES_COLLAPSED_SUMMARY}
      sectionTestId="operator-home-lifecycle-alternatives-disclosure"
    >
      {dualPathCards}
    </OperatorHomeDisclosureSection>
  );
}
