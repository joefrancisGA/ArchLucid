"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  IDENTITY_PROVIDERS_ACTION_REFRESH,
  IDENTITY_PROVIDERS_ACTION_REFRESHING,
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_LABEL,
  IDENTITY_PROVIDERS_LAST_REFRESHED_PREFIX,
  IDENTITY_PROVIDERS_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";

export type IdentityProvidersSettingsPageHeaderProps = {
  readonly pageTitle?: string;
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared identity-provider settings hero — title, lead, contextual help, refresh, and diagnostics shortcut. */
export function IdentityProvidersSettingsPageHeader(
  props: IdentityProvidersSettingsPageHeaderProps,
): React.JSX.Element {
  const pathname = usePathname();
  const pageTitle = props.pageTitle ?? IDENTITY_PROVIDERS_PAGE_TITLE;
  const onDiagnosticsPage = pathname.startsWith(IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF);
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={pageTitle}
      titleTestId="identity-providers-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="identity-providers-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="identity-providers-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? IDENTITY_PROVIDERS_ACTION_REFRESHING : IDENTITY_PROVIDERS_ACTION_REFRESH}
          </Button>
          {onDiagnosticsPage ? null : (
            <Link
              href={IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF}
              className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
              data-testid="identity-providers-diagnostics-link"
            >
              {IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_LABEL}
            </Link>
          )}
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="identity-providers-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {IDENTITY_PROVIDERS_LAST_REFRESHED_PREFIX}:{" "}
          {props.refreshing ? IDENTITY_PROVIDERS_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
