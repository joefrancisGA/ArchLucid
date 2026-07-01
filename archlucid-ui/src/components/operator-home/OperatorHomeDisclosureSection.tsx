"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useId, useLayoutEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  collapseAriaLabel,
  expandAriaLabel,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator-home-disclosure-storage";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type OperatorHomeDisclosureSectionProps = {
  title: string;
  titleId?: string;
  sectionTestId?: string;
  storageKey: string;
  legacyStorageKeys?: readonly string[];
  defaultExpanded: boolean;
  /** Slim rows for low-priority home sections — tighter padding and subordinate title scale. */
  density?: "default" | "slim";
  description?: ReactNode;
  collapsedSummary?: ReactNode;
  headerAside?: ReactNode;
  sectionClassName?: string;
  bodyClassName?: string;
  sectionDataAttributes?: Record<string, string>;
  children: ReactNode;
};

/** Consistent operator-home collapsible: title row, optional collapsed summary, chevron toggle. */
export function OperatorHomeDisclosureSection(props: OperatorHomeDisclosureSectionProps): React.JSX.Element {
  const {
    title,
    titleId: titleIdProp,
    sectionTestId,
    storageKey,
    legacyStorageKeys = [],
    defaultExpanded,
    density = "default",
    description,
    collapsedSummary,
    headerAside,
    sectionClassName,
    bodyClassName,
    sectionDataAttributes,
    children,
  } = props;

  const generatedTitleId = useId().replaceAll(":", "");
  const titleId = titleIdProp ?? generatedTitleId;
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useLayoutEffect(() => {
    setExpanded(readOperatorHomeDisclosureExpanded(storageKey, defaultExpanded, legacyStorageKeys));
    setHydrated(true);
  }, [defaultExpanded, legacyStorageKeys, storageKey]);

  const persistExpanded = useCallback(
    (nextExpanded: boolean) => {
      setExpanded(nextExpanded);
      writeOperatorHomeDisclosureExpanded(storageKey, nextExpanded);
    },
    [storageKey],
  );

  const toggleExpanded = useCallback(() => {
    persistExpanded(!expanded);
  }, [expanded, persistExpanded]);

  const showExpandedContent = hydrated ? expanded : defaultExpanded;
  const toggleLabel = expanded ? collapseAriaLabel(title) : expandAriaLabel(title);
  const slim = density === "slim";

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950",
        slim ? OPERATOR_LAYOUT.disclosure.slim : OPERATOR_LAYOUT.disclosure.default,
        sectionClassName,
      )}
      data-testid={sectionTestId}
      data-disclosure-expanded={hydrated ? String(expanded) : undefined}
      {...sectionDataAttributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={titleId}
              className={cn(
                "m-0 font-semibold text-al-text-primary",
                slim ? OPERATOR_TYPOGRAPHY.helper : OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              {title}
            </h2>
            {headerAside}
          </div>

          {!showExpandedContent && collapsedSummary !== undefined ? (
            <p
              className={cn(
                "m-0 text-neutral-600 dark:text-neutral-400",
                slim ? cn("mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper) : cn("mt-2", OPERATOR_TYPOGRAPHY.body),
              )}
            >
              {collapsedSummary}
            </p>
          ) : null}

          {showExpandedContent && description !== undefined ? (
            <p
              className={cn(
                "m-0 max-w-3xl text-neutral-600 dark:text-neutral-400",
                slim ? cn("mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper) : cn("mt-2", OPERATOR_TYPOGRAPHY.body),
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200",
            slim ? "h-7 w-7" : "h-8 w-8",
          )}
          aria-expanded={expanded}
          aria-controls={`${titleId}-panel`}
          aria-label={toggleLabel}
          onClick={toggleExpanded}
        >
          {expanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </Button>
      </div>

      {showExpandedContent ? (
        <div id={`${titleId}-panel`} className={cn(slim ? OPERATOR_LAYOUT.disclosure.bodyOffsetSlim : OPERATOR_LAYOUT.disclosure.bodyOffset, bodyClassName)}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
