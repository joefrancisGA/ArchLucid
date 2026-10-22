"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { environmentLabel } from "@/app/(marketing)/quick-scan/quick-scan-session";
import type { QuickScanClientState } from "@/app/(marketing)/quick-scan/use-quick-scan-client";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingSeverityLabel } from "@/lib/findings/finding-severity-label";
import { cn } from "@/lib/utils";

type QuickScanResultsSectionProps = {
  readonly client: QuickScanClientState;
};

export function QuickScanResultsSection(props: QuickScanResultsSectionProps): ReactElement | null {
  const { client } = props;
  const result = client.result;

  if (result === null) {
    return null;
  }

  return (
    <section
      className="space-y-6 border-t border-neutral-200 pt-8 dark:border-neutral-800"
      data-testid="quick-scan-results"
      aria-label="Quick scan results"
    >
      <header className="space-y-2">
        <h2
          ref={client.resultsHeadingRef}
          tabIndex={-1}
          className={cn(MARKETING_TYPOGRAPHY.sectionTitle, "scroll-mt-24 outline-none")}
        >
          Analysis result
        </h2>
        <p className={MARKETING_TYPOGRAPHY.meta}>
          {result.systemName} · {environmentLabel(result.primaryEnvironment)}
        </p>
        {result.isSampleResult ? (
          <p className={DESIGN_TOKENS.callout.warn}>
            Illustrative sample only — this is not an analysis of your submission.
          </p>
        ) : null}
        {result.demonstrationDisclaimer ? (
          <p className={cn(MARKETING_SURFACES.mutedPanel, MARKETING_TYPOGRAPHY.body)}>
            {result.demonstrationDisclaimer}
          </p>
        ) : null}
      </header>

      <div>
        <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Overall summary</h3>
        <p className={cn("mt-2", MARKETING_TYPOGRAPHY.body)}>{result.summary}</p>
      </div>

      <div>
        <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Highest-priority risks</h3>
        <ul className="mt-3 space-y-3">
          {(result.findings ?? []).map((finding) => (
            <li
              key={`${finding.title}:${finding.description}`}
              data-testid="quick-scan-finding-card"
              className={MARKETING_SURFACES.cardComfort}
            >
              <div className={MARKETING_TYPOGRAPHY.cardTitle}>{finding.title}</div>
              <div className={MARKETING_TYPOGRAPHY.meta}>{findingSeverityLabel(finding.severity)}</div>
              <p className={cn("mt-2", MARKETING_TYPOGRAPHY.body)}>{finding.description}</p>
            </li>
          ))}
        </ul>
      </div>

      {(result.positiveObservations?.length ?? 0) > 0 ? (
        <div>
          <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Positive observations</h3>
          <ul className={cn("mt-2 list-disc space-y-1 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {result.positiveObservations?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {(result.recommendedNextSteps?.length ?? 0) > 0 ? (
        <div>
          <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>Recommended next steps</h3>
          <ul className={cn("mt-2 list-disc space-y-1 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {result.recommendedNextSteps?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary">
          <Link
            href="/get-started"
            onClick={() => {
              client.onConversionClick("workspace");
            }}
          >
            Sign in to start a full review
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/get-started"
            onClick={() => {
              client.onConversionClick("workspace");
            }}
          >
            Create a workspace review
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/contact"
            onClick={() => {
              client.onConversionClick("demo");
            }}
          >
            Request a demo
          </Link>
        </Button>
      </div>
    </section>
  );
}
