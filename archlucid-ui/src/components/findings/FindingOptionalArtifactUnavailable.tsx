"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  FINDING_OPTIONAL_ARTIFACT_TECHNICAL_DETAILS_OPEN_PARAM,
  findingOptionalArtifactTechnicalDetailsDisclosureHrefFromSearch,
  parseFindingOptionalArtifactTechnicalDetailsOpenFromSearch,
} from "@/lib/findings/finding-optional-artifact-technical-details-disclosure-url";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingOptionalArtifactUnavailableProps = {
  readonly heading: string;
  readonly body: string;
  readonly tryNext?: string | null;
  readonly onRetry?: () => void;
  readonly loading?: boolean;
  readonly showRetry?: boolean;
  readonly recoveryLinks?: readonly { readonly href: string; readonly label: string }[];
  readonly failure?: ApiLoadFailureState | null;
  readonly buyerPolishedShell?: boolean;
};

/** Graceful empty state for optional finding artifacts — no raw HTTP in the primary surface. */
export function FindingOptionalArtifactUnavailable(
  props: FindingOptionalArtifactUnavailableProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const [findingOptionalArtifactTechnicalDetailsOpen, setFindingOptionalArtifactTechnicalDetailsOpenState] =
    useState(() =>
      parseFindingOptionalArtifactTechnicalDetailsOpenFromSearch(
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get(FINDING_OPTIONAL_ARTIFACT_TECHNICAL_DETAILS_OPEN_PARAM),
      ),
    );
  const findingOptionalArtifactTechnicalDetailsOpenRef = useRef(findingOptionalArtifactTechnicalDetailsOpen);
  findingOptionalArtifactTechnicalDetailsOpenRef.current = findingOptionalArtifactTechnicalDetailsOpen;
  const syncFindingOptionalArtifactTechnicalDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingOptionalArtifactTechnicalDetailsDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setFindingOptionalArtifactTechnicalDetailsOpen = useCallback(
    (open: boolean) => {
      if (findingOptionalArtifactTechnicalDetailsOpenRef.current === open) {
        return;
      }

      findingOptionalArtifactTechnicalDetailsOpenRef.current = open;
      setFindingOptionalArtifactTechnicalDetailsOpenState(open);
      syncFindingOptionalArtifactTechnicalDetailsOpenToUrl(open);
    },
    [syncFindingOptionalArtifactTechnicalDetailsOpenToUrl],
  );
  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseFindingOptionalArtifactTechnicalDetailsOpenFromSearch(
        new URLSearchParams(window.location.search).get(FINDING_OPTIONAL_ARTIFACT_TECHNICAL_DETAILS_OPEN_PARAM),
      );

      if (findingOptionalArtifactTechnicalDetailsOpenRef.current === next) {
        return;
      }

      findingOptionalArtifactTechnicalDetailsOpenRef.current = next;
      setFindingOptionalArtifactTechnicalDetailsOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);
  const correlationId = ensureCorrelationId(props.failure?.correlationId ?? props.failure?.problem?.correlationId);
  const httpStatus = props.failure?.httpStatus ?? props.failure?.problem?.status ?? null;
  const showTechnicalDetails = props.buyerPolishedShell !== true && props.failure !== null && props.failure !== undefined;

  return (
    <OperatorErrorCallout>
      <strong>{props.heading}</strong>
      <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.body}</p>
      {props.tryNext !== null && props.tryNext !== undefined && props.tryNext.length > 0 ? (
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.tryNext}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {props.showRetry === true && props.onRetry !== undefined ? (
          <Button type="button" variant="primary" size="sm" disabled={props.loading === true} onClick={props.onRetry}>
            Retry
          </Button>
        ) : null}
        {(props.recoveryLinks ?? []).map((link) => (
          <Button key={link.href} type="button" variant="outline" size="sm" asChild>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>
      {showTechnicalDetails ? (
        <details
          className={cn(
            "mt-4 rounded-md border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/50",
            OPERATOR_TYPOGRAPHY.micro,
          )}
          open={findingOptionalArtifactTechnicalDetailsOpen}
          onToggle={(event) => {
            event.preventDefault();
            setFindingOptionalArtifactTechnicalDetailsOpen(!findingOptionalArtifactTechnicalDetailsOpenRef.current);
          }}
        >
          <summary className={cn("cursor-pointer select-none text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
            Technical details
          </summary>
          <dl className={cn("m-0 mt-2 space-y-1.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {httpStatus !== null ? (
              <div>
                <dt className="inline font-semibold">HTTP </dt>
                <dd className="inline">{httpStatus}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline font-semibold">Request ID: </dt>
              <dd className="inline break-all font-mono">{correlationId}</dd>
              <CopyIdButton value={correlationId} aria-label="Copy request ID" />
            </div>
          </dl>
        </details>
      ) : null}
    </OperatorErrorCallout>
  );
}
