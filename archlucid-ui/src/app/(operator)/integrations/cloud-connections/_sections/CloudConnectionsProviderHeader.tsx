"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE } from "@/lib/cloud-provider-connection-evidence-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

export type CloudConnectionsProviderHeaderProps = {
  readonly providerLabel: string;
  readonly overview: string;
  readonly buyerOverview?: string;
  readonly headerClaimDisciplineTestId?: string;
  readonly statusBadge?: ReactNode;
  readonly primaryAction?: ReactNode;
};

/** Shared provider detail hero — back-link, title, lead, and Category-1 contextual help. */
export function CloudConnectionsProviderHeader(props: CloudConnectionsProviderHeaderProps) {
  const { providerLabel, overview, buyerOverview, headerClaimDisciplineTestId, statusBadge, primaryAction } =
    props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const resolvedOverview = buyerPolishedShell ? (buyerOverview ?? overview) : overview;

  return (
    <OperatorPageHeader
      navHref={CLOUD_CONNECTIONS_PATH}
      title={providerLabel}
      titleTestId={`cloud-connection-${providerLabel.toLowerCase()}-page-title`}
      subtitle={resolvedOverview}
      subtitleClassName={
        buyerPolishedShell ? cn("max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody) : "max-w-3xl"
      }
      claimDiscipline={buyerPolishedShell ? CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE : undefined}
      claimDisciplineTestId={buyerPolishedShell ? headerClaimDisciplineTestId : undefined}
      statusBadge={statusBadge}
      actions={
        buyerPolishedShell ? (
          primaryAction ?? null
        ) : (
          <>
            {primaryAction}
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          </>
        )
      }
      metadata={
        <Link href={CLOUD_CONNECTIONS_PATH} className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}>
          Cloud connections
        </Link>
      }
    />
  );
}
