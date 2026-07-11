"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import { parseArchitectureGeneratedContent } from "@/lib/architecture-generated-content-parser";
import {
  ARCHITECTURE_CREATED_MISSING_HEADING,
} from "@/lib/architecture-created-home-copy";
import type { ArchitectureCreatedHomeModel } from "@/lib/architecture-created-home-model";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import { readArchitectureWorkspaceTabFromHref, type ArchitectureWorkspaceTabId } from "@/lib/architecture-workspace-tabs";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedClarificationsPanelProps = {
  readonly model: ArchitectureCreatedHomeModel;
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly correctionHref: string | null;
  readonly onNavigateTab: (tab: ArchitectureWorkspaceTabId) => void;
};

function ClarificationLink(props: {
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

/** Clarifications tab — unanswered gaps, open questions, and confidence impact. */
export function ArchitectureCreatedClarificationsPanel(
  props: ArchitectureCreatedClarificationsPanelProps,
): React.JSX.Element {
  const parseResult = useMemo(
    () => parseArchitectureGeneratedContent(props.sourceText, props.userAssertions),
    [props.sourceText, props.userAssertions],
  );
  const openQuestions = parseResult.sections.find((section) => section.key === "open-questions");
  const answeredSections = parseResult.sections.filter(
    (section) => section.provenance === "asserted" && section.key !== "open-questions",
  );

  return (
    <div className="space-y-5" data-testid="architecture-workspace-clarifications-panel">
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Unresolved clarifications reduce assessment confidence. Answer open questions or add evidence before sharing
        with sponsors or creating work items.
      </p>

      {props.model.missingItems.length > 0 ? (
        <div className="space-y-2">
          <h2 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
            {ARCHITECTURE_CREATED_MISSING_HEADING}
          </h2>
          <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {props.model.missingItems.map((item) => (
              <li key={item.id}>
                <ClarificationLink
                  href={item.href}
                  label={item.label}
                  onNavigateTab={props.onNavigateTab}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No critical clarification gaps detected from your brief.
        </p>
      )}

      {openQuestions !== undefined ? (
        <ArchitectureStructuredSectionView
          section={openQuestions}
          defaultOpen
          correctionHref={props.correctionHref}
        />
      ) : null}

      {answeredSections.length > 0 ? (
        <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
          <summary className="cursor-pointer font-semibold">
            Answered from your intake ({answeredSections.length})
          </summary>
          <div className="mt-3 space-y-3">
            {answeredSections.map((section) => (
              <ArchitectureStructuredSectionView
                key={section.key}
                section={section}
                defaultOpen={false}
                correctionHref={props.correctionHref}
              />
            ))}
          </div>
        </details>
      ) : null}

      <div className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
          Confidence impact
        </h2>
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Each missing business outcome, system boundary, or evidence artifact lowers how confidently ArchLucid can
          assess risks and recommend remediation. Clarify gaps before running a final assessment or sponsor share.
        </p>
        <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={REVIEWS_NEW_CREATE_ARCHITECTURE_HREF} className="font-medium text-teal-800 dark:text-teal-300">
            Continue clarifying in intake
          </Link>
        </p>
      </div>
    </div>
  );
}
