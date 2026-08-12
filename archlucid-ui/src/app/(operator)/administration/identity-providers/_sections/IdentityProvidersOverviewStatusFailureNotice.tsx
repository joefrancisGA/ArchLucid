"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  IDENTITY_PROVIDERS_ACTION_REFRESH,
  IDENTITY_PROVIDERS_ACTION_REFRESHING,
  IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE,
  IDENTITY_PROVIDERS_OVERVIEW_STATUS_FAILURE_TITLE,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type IdentityProvidersOverviewStatusFailureNoticeProps = {
  readonly failure: IdentityProvidersFetchNote;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
};

export function IdentityProvidersOverviewStatusFailureNotice(
  props: IdentityProvidersOverviewStatusFailureNoticeProps,
): React.JSX.Element {
  return (
    <section
      className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-3", OPERATOR_TYPOGRAPHY.body)}
      data-testid="identity-providers-overview-status-failure"
      role="alert"
    >
      <h2 className={cn("m-0 font-semibold text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {IDENTITY_PROVIDERS_OVERVIEW_STATUS_FAILURE_TITLE}
      </h2>
      <p className="m-0 mt-2 text-amber-900 dark:text-amber-100">{props.failure.message}</p>
      {props.failure.statusCode !== undefined ? (
        <details className="mt-2">
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE}
          </summary>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            HTTP status: {props.failure.statusCode}
          </p>
        </details>
      ) : null}
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="identity-providers-overview-status-retry-button"
          disabled={props.refreshing}
          onClick={props.onRefresh}
        >
          {props.refreshing ? IDENTITY_PROVIDERS_ACTION_REFRESHING : IDENTITY_PROVIDERS_ACTION_REFRESH}
        </Button>
      </div>
    </section>
  );
}
