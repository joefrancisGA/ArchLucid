"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

import { ArchitectureNarrativeMarkdownView } from "@/components/architecture/ArchitectureNarrativeMarkdownView";
import { ArchitectureStructuredContentPanel } from "@/components/architecture/ArchitectureStructuredContentPanel";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { readArchitectureCreationHandoff } from "@/lib/architecture/architecture-creation-handoff";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { prepareArchitectureNarrativeForPresentation } from "@/lib/architecture/architecture-narrative-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const PREVIEW_LINE_COUNT = 4;

function architecturePreviewLines(text: string): readonly string[] {
  const prepared = prepareArchitectureNarrativeForPresentation(text).markdown;
  const lines = prepared.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  if (lines.length > 0) {
    return lines.slice(0, PREVIEW_LINE_COUNT);
  }

  const paragraphs = prepared.split(/\n\s*\n/).map((part) => part.trim()).filter((part) => part.length > 0);

  if (paragraphs.length > 0) {
    return paragraphs.slice(0, PREVIEW_LINE_COUNT);
  }

  return [prepared.slice(0, 280)];
}

function resolveUserAssertions(
  runId: string | null,
  explicitAssertions: ArchitectureCreationUserAssertions | null,
): ArchitectureCreationUserAssertions | null {
  if (explicitAssertions !== null) {
    return explicitAssertions;
  }

  if (runId === null || runId.trim().length === 0) {
    return null;
  }

  const snapshot = readArchitectureCreationHandoff(runId);

  if (snapshot === null) {
    return null;
  }

  return {
    architectureName: snapshot.architectureName,
    architectureOverview: snapshot.architectureOverview,
    businessOutcome: snapshot.businessOutcome,
    peopleAndSystems: snapshot.peopleAndSystems,
  };
}

export type RunDetailSubmittedArchitectureSectionProps = {
  readonly architectureText: string | null;
  readonly canEditSource: boolean;
  readonly editHref: string | null;
  readonly useStructuredPresentation?: boolean;
  readonly runId?: string | null;
  readonly userAssertions?: ArchitectureCreationUserAssertions | null;
  readonly sectionTitle?: string;
  readonly helperText?: string;
};

/** Collapsed submitted architecture — structured on post-creation handoff, legacy prose otherwise. */
export function RunDetailSubmittedArchitectureSection(
  props: RunDetailSubmittedArchitectureSectionProps,
): React.ReactElement | null {
  const [copied, setCopied] = useState(false);
  const text = props.architectureText?.trim() ?? "";
  const sectionTitle = props.sectionTitle ?? "Architecture submitted for review";
  const helperText =
    props.helperText ??
    "ArchLucid review findings and evidence appear above — this is the source material you submitted.";
  const userAssertions = useMemo(
    () => resolveUserAssertions(props.runId ?? null, props.userAssertions ?? null),
    [props.runId, props.userAssertions],
  );

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  if (text.length === 0) {
    return (
      <section id="submitted-architecture" className="scroll-mt-24" data-testid="submitted-architecture-empty">
        <CollapsibleSection
          title={sectionTitle}
          defaultOpen={false}
          sectionTestId="submitted-architecture-collapsible"
        >
          <ArchitectureNarrativeMarkdownView
            markdown=""
            emptyStateMessage="Open the Evidence tab to view submitted documents and diagrams."
          />
        </CollapsibleSection>
      </section>
    );
  }

  if (props.useStructuredPresentation === true) {
    return (
      <section id="submitted-architecture" className="scroll-mt-24" data-testid="submitted-architecture-section">
        <details
          className="mb-6 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="submitted-architecture-collapsible"
          data-workspace-disclosure
          open
        >
          <summary
            className={cn("cursor-pointer select-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {sectionTitle}
          </summary>
          <div className="mt-3 space-y-3">
            <ArchitectureStructuredContentPanel
              sourceText={text}
              userAssertions={userAssertions}
              correctionHref={props.canEditSource ? props.editHref : null}
              runId={props.runId ?? null}
            />
            <div className="flex flex-wrap items-center gap-2">
              {props.canEditSource && props.editHref !== null ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={props.editHref}>Edit source</a>
                </Button>
              ) : null}
            </div>
          </div>
        </details>
        <p className={cn("m-0 -mt-4 mb-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {helperText}
        </p>
      </section>
    );
  }

  const previewLines = architecturePreviewLines(text);
  const hasMore = text.split(/\r?\n/).filter((line) => line.trim().length > 0).length > previewLines.length;

  return (
    <section id="submitted-architecture" className="scroll-mt-24" data-testid="submitted-architecture-section">
      <details
        className="mb-6 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="submitted-architecture-collapsible"
        data-workspace-disclosure
      >
        <summary
          className={cn("cursor-pointer select-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {sectionTitle}
        </summary>
        <div className="mt-3 space-y-3">
          <p className={cn("m-0 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Submitted architecture
          </p>
          <div
            className={cn(
              "rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="submitted-architecture-preview"
          >
            <ArchitectureNarrativeMarkdownView markdown={previewLines.join("\n\n")} />
            {hasMore ? (
              <p className="m-0 mt-2 text-neutral-500 dark:text-neutral-400">Expand to read the full description.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyText}>
              {copied ? "Copied" : "Copy"}
            </Button>
            {props.canEditSource && props.editHref !== null ? (
              <Button variant="outline" size="sm" asChild>
                <a href={props.editHref}>Edit source</a>
              </Button>
            ) : null}
          </div>
          <details className="rounded-md border border-dashed border-neutral-200 p-3 dark:border-neutral-700">
            <summary className={cn("cursor-pointer font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Expand full description
            </summary>
            <div className="mt-3">
              <ArchitectureNarrativeMarkdownView markdown={text} tableCaption="Submitted architecture narrative table" />
            </div>
          </details>
        </div>
      </details>
      <p className={cn("m-0 -mt-4 mb-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {helperText}
      </p>
    </section>
  );
}
