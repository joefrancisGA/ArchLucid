"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  BILLING_HELP_ACTION_REFRESH,
  BILLING_HELP_ACTION_REFRESHING,
  BILLING_HELP_CANONICAL_PATH,
  BILLING_HELP_PAGE_DISPLAY_TITLE,
  BILLING_HELP_PAGE_TITLE,
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

/** Shared `/help/billing-and-plans` hero — help breadcrumb, title, contextual help, and refresh. */
export function HelpBillingAndPlansPageHeader(props: HelpBillingAndPlansPageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={BILLING_HELP_PAGE_DISPLAY_TITLE}
      titleTestId="help-billing-page-title"
      subtitle={props.subtitle}
      navHref={BILLING_HELP_CANONICAL_PATH}
      headingLevel="h1"
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="help-billing-breadcrumb"
          items={[
            { label: "Help", href: "/help" },
            { label: BILLING_HELP_PAGE_TITLE },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-billing-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="help-billing-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? BILLING_HELP_ACTION_REFRESHING : BILLING_HELP_ACTION_REFRESH}
          </Button>
        </div>
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
