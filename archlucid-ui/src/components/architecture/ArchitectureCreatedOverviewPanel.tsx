"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import { parseArchitectureGeneratedContent } from "@/lib/architecture-generated-content-parser";
import {
  ARCHITECTURE_CREATED_MISSING_HEADING,
} from "@/lib/architecture-created-home-copy";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture-created-home-model";
import type {
  ArchitectureCreationUserAssertions,
  ArchitectureStructuredSectionKey,
} from "@/lib/architecture-structured-content-types";
import { readArchitectureWorkspaceTabFromHref, type ArchitectureWorkspaceTabId } from "@/lib/architecture-workspace-tabs";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

const OVERVIEW_SECTION_KEYS: readonly ArchitectureStructuredSectionKey[] = [
  "executive-summary",
  "business-outcome",
  "scope",
  "users-and-stakeholders",
  "systems-and-services",
  "constraints",
  "risks",
];

export type ArchitectureCreatedOverviewPanelProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly correctionHref: string | null;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
  readonly submittedArchitectureSection: React.ReactNode;
};

function MissingItemLink(props: {
  readonly href: string;
  readonly label: string;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
}): React.JSX.Element {
  const tab = readArchitectureWorkspaceTabFromHref(props.href);

  if (tab !== null) {
    return (
      <button
        type="button"
        className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
        onClick={() => {
          props.onNavigateTab(tab);
        }}
      >
        {props.label}
      </button>
    );
  }

  return (
    <Link
      href={props.href}
      className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
    >
      {props.label}
    </Link>
  );
}

/** Overview tab — executive architecture narrative without operational chrome. */
export function ArchitectureCreatedOverviewPanel(
  props: ArchitectureCreatedOverviewPanelProps,
): React.JSX.Element {
  const parseResult = useMemo(
    () => parseArchitectureGeneratedContent(props.sourceText, props.userAssertions),
    [props.sourceText, props.userAssertions],
  );
  const overviewSections = parseResult.sections.filter((section) =>
    OVERVIEW_SECTION_KEYS.includes(section.key),
  );
  const continueClarifyingHref = props.correctionHref ?? REVIEWS_NEW_CREATE_ARCHITECTURE_HREF;

  return (
    <div className="space-y-5" data-testid="architecture-workspace-overview-panel">
      {overviewSections.length > 0 ? (
        <div className="space-y-3">
          {overviewSections.map((section) => (
            <ArchitectureStructuredSectionView
              key={section.key}
              section={section}
              defaultOpen={section.key === "executive-summary" || section.key === "business-outcome"}
              correctionHref={props.correctionHref}
            />
          ))}
        </div>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Structured overview sections will appear as ArchLucid extracts more from your brief.
        </p>
      )}

      {props.model.missingItems.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <h3 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
            {ARCHITECTURE_CREATED_MISSING_HEADING}
          </h3>
          <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {props.model.missingItems.map((item) => (
              <li key={item.id}>
                <MissingItemLink
                  href={item.href}
                  label={item.label}
                  onNavigateTab={props.onNavigateTab}
                />
              </li>
            ))}
          </ul>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            <Link href={continueClarifyingHref} className="font-medium text-teal-800 dark:text-teal-300">
              Continue clarifying
            </Link>{" "}
            to improve completeness and assessment confidence.
          </p>
        </div>
      ) : null}

      <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
        <summary className="cursor-pointer font-semibold">Generated source and submitted brief</summary>
        <div className="mt-3">{props.submittedArchitectureSection}</div>
      </details>
    </div>
  );
}
