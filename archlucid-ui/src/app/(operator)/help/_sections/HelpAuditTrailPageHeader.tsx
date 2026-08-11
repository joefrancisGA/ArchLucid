"use client";

import Link from "next/link";

import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import {
  AUDIT_TRAIL_HELP_CANONICAL_PATH,
  AUDIT_TRAIL_HELP_PAGE_TITLE,
  AUDIT_TRAIL_HELP_PRIMARY_ACTIONS,
  AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF,
  AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_LABEL,
} from "@/lib/audit-trail-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

export type HelpAuditTrailPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subtitle: string;
};

/** Shared `/help/audit-trail` hero — help breadcrumb, provenance, live audit trail CTA, and export actions. */
export function HelpAuditTrailPageHeader(props: HelpAuditTrailPageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={AUDIT_TRAIL_HELP_PAGE_TITLE}
      titleTestId="help-audit-trail-page-title"
      subtitle={props.subtitle}
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="help-audit-trail-breadcrumb"
          items={[
            { label: "Help", href: "/help" },
            { label: AUDIT_TRAIL_HELP_PAGE_TITLE },
          ]}
        />
      }
      metadata={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="help-audit-trail-provenance">
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)} data-testid="help-audit-trail-source-of-record">
            Related topic:{" "}
            <Link
              href={AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF}
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              {AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_LABEL}
            </Link>
          </span>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-audit-trail-header-actions">
          <Button asChild size="sm" variant="primary" data-testid="help-audit-trail-header-open-audit-trail">
            <Link href={AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.href}>
              {AUDIT_TRAIL_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
            </Link>
          </Button>
          <HelpTopicPrintButton entry={props.entry} />
        </div>
      }
      navHref={AUDIT_TRAIL_HELP_CANONICAL_PATH}
    />
  );
}
