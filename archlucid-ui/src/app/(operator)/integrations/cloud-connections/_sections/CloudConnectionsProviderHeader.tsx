"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CloudConnectionsProviderHeaderProps = {
  readonly providerLabel: string;
  readonly overview: string;
  readonly statusBadge?: ReactNode;
};

/** Shared provider detail hero — back-link, title, lead, and Category-1 contextual help. */
export function CloudConnectionsProviderHeader(props: CloudConnectionsProviderHeaderProps) {
  const { providerLabel, overview, statusBadge } = props;

  return (
    <OperatorPageHeader
      title={providerLabel}
      titleTestId={`cloud-connection-${providerLabel.toLowerCase()}-page-title`}
      subtitle={overview}
      statusBadge={statusBadge}
      actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}
      metadata={
        <Link href={CLOUD_CONNECTIONS_PATH} className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}>
          Cloud connections
        </Link>
      }
    />
  );
}
