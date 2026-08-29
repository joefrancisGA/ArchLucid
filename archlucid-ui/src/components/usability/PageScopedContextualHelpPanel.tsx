"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PageContextualHelpEntry } from "@/lib/contextual-help-registry";
import {
  dedupeDrawerRelatedLinks,
  shouldShowDrawerSupplementDetail,
  type PageHelpDrawerSupplement,
} from "@/lib/help/page-help-drawer-supplement";
import { PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME } from "@/components/usability/page-contextual-help-trigger";

export const OPEN_FULL_HELP_PAGE_LABEL = "Open full help page";

export type PageScopedContextualHelpPanelProps = {
  readonly entry?: PageContextualHelpEntry | null;
  /** Full topic name — used for the accessible name (`Help: {triggerLabel}`). */
  readonly triggerLabel: string;
  /** Optional short visible trigger text (e.g. "Help"); defaults to `triggerLabel`. */
  readonly triggerText?: string;
  readonly learnMoreHref?: string | null;
  readonly supplement?: PageHelpDrawerSupplement | null;
  /**
   * Optional drawer section id to scroll into view on open (for example `what-to-do-next`).
   * Unknown ids are ignored so future deep links can land on a subsection without a new API.
   */
  readonly sectionId?: string | null;
};

type HelpFieldProps = {
  readonly sectionId: string;
  readonly label: string;
  readonly body: string;
  readonly action?: { readonly label: string; readonly href: string };
  readonly actionTestId?: string;
};

export function pageHelpDrawerSectionDomId(sectionId: string): string {
  return `page-help-section-${sectionId.trim()}`;
}

function HelpField({ sectionId, label, body, action, actionTestId }: HelpFieldProps) {
  return (
    <div className="space-y-0.5" id={pageHelpDrawerSectionDomId(sectionId)}>
      <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}>
        {label}
      </p>
      <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0")}>{body}</p>
      {action != null ? (
        <p className={cn("m-0 pt-0.5", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            href={action.href}
            className={OPERATOR_LINK.inline}
            data-testid={actionTestId}
          >
            {action.label} →
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function TaskStepsList({ steps }: { readonly steps: readonly string[] }) {
  return (
    <div className="space-y-1" id={pageHelpDrawerSectionDomId("how-to-do-this")}>
      <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}>
        How to do this
      </p>
      <ol className={cn("m-0 list-decimal space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {steps.map((step) => (
          <li key={step} className="m-0 pl-0.5">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function KeyPointsList({ points }: { readonly points: readonly string[] }) {
  return (
    <div className="space-y-1" id={pageHelpDrawerSectionDomId("key-points")}>
      <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}>Key points</p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {points.map((point) => (
          <li key={point} className="m-0 pl-0.5">
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedLinksList({
  links,
}: {
  readonly links: readonly { readonly label: string; readonly href: string }[];
}) {
  return (
    <div className="space-y-1" id={pageHelpDrawerSectionDomId("related-links")}>
      <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}>Related links</p>
      <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`} className="m-0">
            <Link href={link.href} className={OPERATOR_LINK.inline}>
              {link.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Page-scoped contextual help: press the header trigger to open a non-modal right drawer.
 * Category-1 answers stay on the current page; Open full help page is the escape hatch to `/help/{slug}`.
 */
export function PageScopedContextualHelpPanel({
  entry,
  triggerLabel,
  triggerText,
  learnMoreHref,
  supplement,
  sectionId,
}: PageScopedContextualHelpPanelProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const visibleTriggerText = triggerText ?? triggerLabel;
  const dialogLabel = `Help: ${triggerLabel}`;
  const taskSteps = entry?.taskSteps;
  const supplementDetail =
    supplement?.detail != null &&
    (entry == null || shouldShowDrawerSupplementDetail(supplement.detail, entry.whatIsThisPage))
      ? supplement.detail
      : null;
  const supplementKeyPoints = supplement?.keyPoints ?? [];
  const existingActionHrefs = [
    entry?.whatToDoNextAction?.href,
    entry?.whereToConfigureAction?.href,
    learnMoreHref ?? undefined,
  ].filter((href): href is string => href != null && href.trim().length > 0);
  const supplementRelatedLinks = dedupeDrawerRelatedLinks(supplement?.relatedLinks, existingActionHrefs);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmedSectionId = sectionId?.trim() ?? "";

    if (trimmedSectionId.length === 0) {
      return;
    }

    const scrollToSection = (): boolean => {
      const target = document.getElementById(pageHelpDrawerSectionDomId(trimmedSectionId));

      if (target === null) {
        return false;
      }

      target.scrollIntoView({ block: "start" });
      return true;
    };

    if (scrollToSection()) {
      return;
    }

    // The drawer portals after open; retry once the node exists.
    const frame = window.requestAnimationFrame(() => {
      scrollToSection();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open, sectionId]);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className={PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME}
          data-testid="page-contextual-help-button"
          aria-label={dialogLabel}
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
          <span>{visibleTriggerText}</span>
        </button>
      </DialogTrigger>

      <HelpDrawerContent
        returnFocusRef={triggerRef}
        modal={false}
        closeAriaLabel="Close help"
        aria-label={dialogLabel}
        aria-describedby={undefined}
        data-testid="page-scoped-contextual-help-panel"
        onPointerDownOutside={(event) => {
          // Keep the current page usable while the operator follows the steps.
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 border-b border-neutral-200 px-5 pb-3 pt-5 pr-12 text-left dark:border-neutral-800">
          <DialogTitle className={cn("text-left", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {triggerLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {entry != null ? (
            <>
              <HelpField sectionId="what-is-this-page" label="What is this page?" body={entry.whatIsThisPage} />
              <HelpField
                sectionId="what-to-do-next"
                label="What to do next"
                body={entry.whatToDoNext}
                action={entry.whatToDoNextAction}
                actionTestId="page-scoped-contextual-help-next-action"
              />
              {taskSteps != null && taskSteps.length > 0 ? <TaskStepsList steps={taskSteps} /> : null}
              {supplementDetail != null ? (
                <HelpField sectionId="more-detail" label="More detail" body={supplementDetail} />
              ) : null}
              {supplementKeyPoints.length > 0 ? <KeyPointsList points={supplementKeyPoints} /> : null}
              {supplementRelatedLinks.length > 0 ? <RelatedLinksList links={supplementRelatedLinks} /> : null}
              {entry.whyEmpty != null ? (
                <HelpField sectionId="why-empty" label="Why is this empty?" body={entry.whyEmpty} />
              ) : null}
              {entry.whereToConfigurePrerequisite != null ? (
                <HelpField
                  sectionId="where-to-configure"
                  label="Where to configure"
                  body={entry.whereToConfigurePrerequisite}
                  action={entry.whereToConfigureAction}
                  actionTestId="page-scoped-contextual-help-configure-action"
                />
              ) : null}
            </>
          ) : supplement?.detail != null || (supplement?.keyPoints?.length ?? 0) > 0 ? (
            <>
              {supplementDetail != null ? (
                <HelpField sectionId="more-detail" label="More detail" body={supplementDetail} />
              ) : null}
              {supplementKeyPoints.length > 0 ? <KeyPointsList points={supplementKeyPoints} /> : null}
              {supplementRelatedLinks.length > 0 ? <RelatedLinksList links={supplementRelatedLinks} /> : null}
            </>
          ) : (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Open the full help page for guidance on this screen.
            </p>
          )}
        </div>

        {learnMoreHref != null ? (
          <div className="shrink-0 border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">
            <Link
              href={learnMoreHref}
              className={OPERATOR_LINK.optional}
              data-testid="page-scoped-contextual-help-learn-more"
            >
              {OPEN_FULL_HELP_PAGE_LABEL}
            </Link>
          </div>
        ) : null}
      </HelpDrawerContent>
    </Dialog>
  );
}
