"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE,
  IDENTITY_PROVIDERS_OVERVIEW_STATUS_FAILURE_TITLE,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  identityProvidersOverviewStatusFailureDetailsDisclosureHrefFromSearch,
  parseIdentityProvidersOverviewStatusFailureDetailsOpenFromSearch,
} from "@/lib/administration/identity-providers-overview-status-failure-details-disclosure-url";

export type IdentityProvidersOverviewStatusFailureNoticeProps = {
  readonly failure: IdentityProvidersFetchNote;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
};

export function IdentityProvidersOverviewStatusFailureNotice(
  props: IdentityProvidersOverviewStatusFailureNoticeProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/identity-providers";
  const searchParams = useSearchParams();
  const identityProvidersOverviewStatusFailureDetailsOpenParam = searchParams.get(
    "identityProvidersOverviewStatusFailureDetailsOpen",
  );
  const [technicalDetailsOpen, setTechnicalDetailsOpenState] = useState(() =>
    parseIdentityProvidersOverviewStatusFailureDetailsOpenFromSearch(
      identityProvidersOverviewStatusFailureDetailsOpenParam,
    ),
  );

  const syncTechnicalDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        identityProvidersOverviewStatusFailureDetailsDisclosureHrefFromSearch(
          searchParams.toString(),
          open,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setTechnicalDetailsOpen = useCallback(
    (open: boolean) => {
      setTechnicalDetailsOpenState(open);
      syncTechnicalDetailsOpenToUrl(open);
    },
    [syncTechnicalDetailsOpenToUrl],
  );

  useEffect(() => {
    setTechnicalDetailsOpenState(
      parseIdentityProvidersOverviewStatusFailureDetailsOpenFromSearch(
        identityProvidersOverviewStatusFailureDetailsOpenParam,
      ),
    );
  }, [identityProvidersOverviewStatusFailureDetailsOpenParam]);

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
        <details
          className="mt-2"
          open={technicalDetailsOpen}
          onToggle={(event) => {
            setTechnicalDetailsOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE}
          </summary>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            HTTP status: {props.failure.statusCode}
          </p>
        </details>
      ) : null}
      <div className="mt-3">
        <RefreshButton
          busy={props.refreshing}
          data-testid="identity-providers-overview-status-retry-button"
          onClick={props.onRefresh}
        />
      </div>
    </section>
  );
}
