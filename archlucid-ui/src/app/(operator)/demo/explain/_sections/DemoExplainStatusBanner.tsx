"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { CopyIdButton } from "@/components/CopyIdButton";
import { StatusTag } from "@/components/StatusTag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEMO_EXPLAIN_GENERATED_ISO_LABEL,
  DEMO_EXPLAIN_MANIFEST_VERSION_LABEL,
  DEMO_EXPLAIN_REVIEW_ID_LABEL,
  DEMO_EXPLAIN_STATUS_BANNER_TECHNICAL_DETAILS_LABEL,
  formatDemoExplainGeneratedLabel,
  resolveDemoExplainStatusTag,
} from "@/lib/demo-explain-page-copy";
import {
  demoExplainStatusTechnicalDisclosureHrefFromSearch,
  parseDemoExplainStatusTechnicalOpenFromSearch,
} from "@/lib/demo-explain-status-technical-disclosure-url";
import { cn } from "@/lib/utils";
import type { DemoExplainResponse } from "@/types/demo-explain";

type Props = {
  readonly payload: DemoExplainResponse;
};

export function DemoExplainStatusBanner(props: Props) {
  const payload = props.payload;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const demoExplainStatusTechnicalOpenParam = searchParams.get("demoExplainStatusTechnicalOpen");
  const [statusTechnicalOpen, setStatusTechnicalOpenState] = useState(() =>
    parseDemoExplainStatusTechnicalOpenFromSearch(demoExplainStatusTechnicalOpenParam),
  );
  const syncStatusTechnicalOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        demoExplainStatusTechnicalDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setStatusTechnicalOpen = useCallback(
    (open: boolean) => {
      setStatusTechnicalOpenState(open);
      syncStatusTechnicalOpenToUrl(open);
    },
    [syncStatusTechnicalOpenToUrl],
  );

  useEffect(() => {
    setStatusTechnicalOpenState(parseDemoExplainStatusTechnicalOpenFromSearch(demoExplainStatusTechnicalOpenParam));
  }, [demoExplainStatusTechnicalOpenParam]);

  const statusTag = resolveDemoExplainStatusTag(payload.isDemoData, payload.demoStatusMessage);
  const generatedLabel = formatDemoExplainGeneratedLabel(payload.generatedUtc);

  return (
    <div
      data-testid="demo-explain-status-banner"
      className={cn(
        "space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.helper,
      )}
    >
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="demo-explain-status-banner-summary"
        role="status"
      >
        <StatusTag kind={statusTag.kind} label={statusTag.label} />
        <span className="text-neutral-700 dark:text-neutral-300">{generatedLabel}</span>
      </div>
      <AdvancedOptionsAccordion
        triggerLabel={DEMO_EXPLAIN_STATUS_BANNER_TECHNICAL_DETAILS_LABEL}
        open={statusTechnicalOpen}
        onOpenChange={setStatusTechnicalOpen}
      >
        <dl
          className={cn(
            "m-0 grid gap-2 text-neutral-600 dark:text-neutral-400 sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-1",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">{DEMO_EXPLAIN_REVIEW_ID_LABEL}</dt>
          <dd className="m-0 flex min-w-0 flex-wrap items-center gap-1">
            <code
              className={cn(
                "truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {payload.runId}
            </code>
            <CopyIdButton value={payload.runId} aria-label="Copy review ID" />
          </dd>
          {payload.manifestVersion ? (
            <>
              <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                {DEMO_EXPLAIN_MANIFEST_VERSION_LABEL}
              </dt>
              <dd className="m-0">
                <code
                  className={cn(
                    "rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                >
                  {payload.manifestVersion}
                </code>
              </dd>
            </>
          ) : null}
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">{DEMO_EXPLAIN_GENERATED_ISO_LABEL}</dt>
          <dd className="m-0">
            <code
              className={cn(
                "rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {payload.generatedUtc}
            </code>
          </dd>
        </dl>
      </AdvancedOptionsAccordion>
    </div>
  );
}
