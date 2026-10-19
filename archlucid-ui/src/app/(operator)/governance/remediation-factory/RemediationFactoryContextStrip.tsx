"use client";

import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { StatusTag } from "@/components/ui/status-tag";
import { useBooleanSearchParamUrlSync } from "@/hooks/use-boolean-search-param-url-sync";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch,
  remediationFactorySelectionIdentityDisclosureHrefFromSearch,
  REMEDIATION_FACTORY_SELECTION_IDENTITY_DISCLOSURE_OPEN_PARAM,
} from "@/lib/remediation-factory/remediation-factory-selection-identity-disclosure-url";
import { cn } from "@/lib/utils";

import {
  REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID,
} from "./remediation-factory-page-copy";

export type RemediationFactoryContextStripProps = {
  readonly freshnessLabel: string;
  readonly lastRefreshedAt: Date | null;
  readonly selectionLabel: string | null;
  readonly scopeLabel: string;
  readonly findingId: string | null;
  readonly pathId: string | null;
};

export function RemediationFactoryContextStrip(props: RemediationFactoryContextStripProps) {
  const [technicalIdsOpen, setTechnicalIdsOpen] = useBooleanSearchParamUrlSync(
    REMEDIATION_FACTORY_SELECTION_IDENTITY_DISCLOSURE_OPEN_PARAM,
    parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch,
    remediationFactorySelectionIdentityDisclosureHrefFromSearch,
  );
  const hasTechnicalIds = props.findingId !== null || props.pathId !== null;

  return (
    <div
      className={cn(
        "sticky top-[calc(var(--app-shell-sticky,6rem)+0.25rem)] z-[5] flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-950/95",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="remediation-factory-context-strip"
    >
      <OperatorPageFreshnessMetadata
        testId="remediation-factory-context-freshness"
        lastRefreshedAt={props.lastRefreshedAt}
      >
        {props.freshnessLabel}
      </OperatorPageFreshnessMetadata>
      <span className="text-al-text-secondary" aria-hidden>
        ·
      </span>
      <span className="min-w-0 text-al-text-secondary" data-testid="remediation-factory-context-scope">
        {props.scopeLabel}
      </span>
      {props.selectionLabel !== null ? (
        <>
          <span className="text-al-text-secondary" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate font-medium text-al-text-primary" data-testid="remediation-factory-context-selection">
            {props.selectionLabel}
          </span>
        </>
      ) : (
        <>
          <span className="text-al-text-secondary" aria-hidden>
            ·
          </span>
          <StatusTag kind="neutral" label="No row selected" />
        </>
      )}
      {hasTechnicalIds ? (
        <details
          className="min-w-0"
          data-testid="remediation-factory-context-technical-ids"
          open={technicalIdsOpen}
          onToggle={(event) => {
            setTechnicalIdsOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>Technical ids</summary>
          <div className="mt-1 space-y-1">
            {props.findingId !== null ? (
              <p className={cn("m-0 flex flex-wrap items-center gap-2 break-all font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                <span>Finding</span>
                <span>{props.findingId}</span>
                <CopyIdButton value={props.findingId} aria-label="Copy finding ID" />
              </p>
            ) : null}
            {props.pathId !== null ? (
              <p className={cn("m-0 flex flex-wrap items-center gap-2 break-all font-mono", OPERATOR_TYPOGRAPHY.helper)}>
                <span>Path</span>
                <span>{props.pathId}</span>
                <CopyIdButton value={props.pathId} aria-label="Copy path ID" />
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
      <Link
        href={`#${REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID}`}
        className="ml-auto shrink-0 text-[color:var(--al-accent-interactive)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="remediation-factory-context-jump-to-inspect"
      >
        Jump to inspect
      </Link>
    </div>
  );
}
