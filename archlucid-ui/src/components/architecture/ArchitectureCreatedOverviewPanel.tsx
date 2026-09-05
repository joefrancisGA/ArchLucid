"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArchitectureCreatedOverviewEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedOverviewEvidenceOrientationStrip";
import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import { ArchitectureStructuringFailureNotice } from "@/components/architecture/ArchitectureStructuringFailureNotice";
import { Button } from "@/components/ui/button";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import {
  ARCHITECTURE_CREATED_OVERVIEW_EMPTY_CAUSE,
  ARCHITECTURE_CREATED_OVERVIEW_EMPTY_HEADING,
  ARCHITECTURE_CREATED_OVERVIEW_PROVENANCE_LEGEND,
} from "@/lib/architecture/architecture-created-overview-sources";
import type {
  ArchitectureCreationUserAssertions,
  ArchitectureStructuredSectionKey,
} from "@/lib/architecture/architecture-structured-content-types";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureWorkspaceTabId } from "@/lib/architecture/architecture-workspace-tabs";
import {
  parseSubmittedBriefOpenFromSearch,
  submittedBriefDisclosureHrefFromSearch,
} from "@/lib/architecture/submitted-brief-disclosure-url";

const OVERVIEW_SECTION_KEYS: readonly ArchitectureStructuredSectionKey[] = [
  "sponsor-report",
  "business-outcome",
  "risks",
  "constraints",
  "scope",
  "users-and-stakeholders",
  "systems-and-services",
];

const OVERVIEW_DEFAULT_OPEN_KEYS: ReadonlySet<ArchitectureStructuredSectionKey> = new Set([
  "sponsor-report",
  "business-outcome",
  "risks",
  "constraints",
]);

export type ArchitectureCreatedOverviewPanelProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly correctionHref: string | null;
  readonly openClarificationGapCount: number;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
  readonly submittedArchitectureSection: React.ReactNode;
  /** When Do this next owns the page primary, keep tab-scoped follow-ons as outline actions. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** Overview tab — sponsor architecture narrative without operational chrome. */
export function ArchitectureCreatedOverviewPanel(
  props: ArchitectureCreatedOverviewPanelProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const submittedBriefOpenParam = searchParams.get("submittedBriefOpen");
  const [parseAttempt, setParseAttempt] = useState(0);
  const [submittedBriefOpen, setSubmittedBriefOpenState] = useState(() =>
    parseSubmittedBriefOpenFromSearch(submittedBriefOpenParam),
  );

  const syncSubmittedBriefOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(submittedBriefDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSubmittedBriefOpen = useCallback(
    (open: boolean) => {
      setSubmittedBriefOpenState(open);
      syncSubmittedBriefOpenToUrl(open);
    },
    [syncSubmittedBriefOpenToUrl],
  );

  useEffect(() => {
    setSubmittedBriefOpenState(parseSubmittedBriefOpenFromSearch(submittedBriefOpenParam));
  }, [submittedBriefOpenParam]);

  const parseResult = useMemo(
    () => {
      void parseAttempt;
      return parseArchitectureGeneratedContent(props.sourceText, props.userAssertions);
    },
    [props.sourceText, props.userAssertions, parseAttempt],
  );
  const overviewSections = parseResult.sections.filter((section) =>
    OVERVIEW_SECTION_KEYS.includes(section.key),
  );
  const continueClarifyingHref = props.correctionHref ?? REVIEWS_NEW_CREATE_ARCHITECTURE_HREF;
  const clarificationGapCount = props.openClarificationGapCount;
  const showStructuredSections = overviewSections.length > 0;
  const showEmptyOverviewState = !showStructuredSections && !parseResult.hasPartialParseFailure;
  const continueClarifyingVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";

  return (
    <div
      className="space-y-5"
      data-testid="architecture-workspace-overview-panel"
      role="region"
      aria-labelledby="architecture-overview-heading"
    >
      <h2 id="architecture-overview-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Architecture overview
      </h2>

      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-overview-provenance-legend"
      >
        {ARCHITECTURE_CREATED_OVERVIEW_PROVENANCE_LEGEND}
      </p>

      {parseResult.hasPartialParseFailure ? (
        <ArchitectureStructuringFailureNotice
          runId={props.model.runId}
          onRetry={() => {
            setParseAttempt((current) => current + 1);
          }}
        />
      ) : null}

      {showStructuredSections ? (
        <div className="space-y-3">
          {overviewSections.map((section) => (
            <ArchitectureStructuredSectionView
              key={section.key}
              section={section}
              defaultOpen={OVERVIEW_DEFAULT_OPEN_KEYS.has(section.key)}
              correctionHref={props.correctionHref}
            />
          ))}
        </div>
      ) : null}

      {showEmptyOverviewState ? (
        <div
          className="space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="architecture-overview-empty-state"
        >
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {ARCHITECTURE_CREATED_OVERVIEW_EMPTY_HEADING}
          </h3>
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_CREATED_OVERVIEW_EMPTY_CAUSE}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={continueClarifyingVariant}
              size="sm"
              asChild
              data-testid="architecture-overview-continue-clarifying"
            >
              <Link href={continueClarifyingHref}>Continue clarifying</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="architecture-overview-open-submitted-brief"
              onClick={() => {
                setSubmittedBriefOpen(true);
              }}
            >
              Open the submitted brief
            </Button>
          </div>
        </div>
      ) : null}

      {clarificationGapCount > 0 ? (
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {clarificationGapCount === 1
            ? "1 item still needs your answer before assessment confidence improves."
            : `${clarificationGapCount} items still need your answers before assessment confidence improves.`}{" "}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-1 inline-flex align-middle"
            data-testid="architecture-overview-review-clarifications"
            onClick={() => {
              props.onNavigateTab("clarifications");
            }}
          >
            Open clarifications
          </Button>
        </p>
      ) : null}

      <details
        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
        data-testid="architecture-overview-submitted-brief"
        open={submittedBriefOpen}
        onToggle={(event) => {
          setSubmittedBriefOpen(event.currentTarget.open);
        }}
      >
        <summary className="cursor-pointer font-semibold">Generated source and submitted brief</summary>
        <div className="mt-3">{props.submittedArchitectureSection}</div>
      </details>

      <ArchitectureCreatedOverviewEvidenceOrientationStrip />
    </div>
  );
}
