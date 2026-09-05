"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { HelpBillingAndPlansHeaderActions } from "@/app/(operator)/help/_sections/HelpBillingAndPlansHeaderActions";
import {
  BILLING_HELP_CANONICAL_PATH,
  BILLING_HELP_PAGE_DISPLAY_TITLE,
} from "@/lib/billing-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

export type HelpBillingAndPlansPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly refreshError: string | null;
  readonly onRefresh: () => void;
};

/** Shared `/help/billing-and-plans` hero — title, contextual help, and refresh. */
export function HelpBillingAndPlansPageHeader(props: HelpBillingAndPlansPageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={BILLING_HELP_PAGE_DISPLAY_TITLE}
      titleTestId="help-billing-page-title"
      subtitle={props.subtitle}
      navHref={BILLING_HELP_CANONICAL_PATH}
      headingLevel="h1"
      actions={
        <HelpBillingAndPlansHeaderActions refreshing={props.refreshing} onRefresh={props.onRefresh} />
      }
      metadata={
        props.refreshError !== null ? (
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-billing-refresh-error"
          >
            {props.refreshError}
          </span>
        ) : null
      }
    />
  );
}
