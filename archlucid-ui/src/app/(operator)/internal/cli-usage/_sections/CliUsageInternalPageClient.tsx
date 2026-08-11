"use client";

import { HelpCliUsageTechnicalReferenceView } from "@/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type CliUsageInternalPageClientProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Admin-only CLI usage technical reference — internal ops, not buyer help. */
export function CliUsageInternalPageClient(
  props: CliUsageInternalPageClientProps,
): React.JSX.Element {
  const { entry, markdown } = props;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  if (isAuthorityLoading) {
    return (
      <OperatorPageContainer variant="dashboard" data-testid="cli-usage-internal-page-loading">
        <p className={cn("text-al-text-secondary", OPERATOR_TYPE_SCALE.body)}>Loading access…</p>
      </OperatorPageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <OperatorPageContainer variant="dashboard" data-testid="cli-usage-internal-page-denied">
        <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPE_SCALE.body)} role="alert">
          This page requires tenant administrator access (AdminAuthority).
        </p>
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" data-testid="cli-usage-internal-page">
      <HelpCliUsageTechnicalReferenceView entry={entry} markdown={markdown} />
    </OperatorPageContainer>
  );
}
