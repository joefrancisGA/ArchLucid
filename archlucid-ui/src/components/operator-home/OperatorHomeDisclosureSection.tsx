"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useState, type ReactNode } from "react";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { Button } from "@/components/ui/button";
import {
  collapseAriaLabel,
  expandAriaLabel,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator/operator-home-disclosure-storage";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";

type OperatorHomeDisclosureSectionProps = {
  title: string;
  /** When set, the section title is a navigation link (chevron still expands/collapses). */
  titleHref?: string;
  titleId?: string;
  sectionTestId?: string;
  storageKey: string;
  legacyStorageKeys?: readonly string[];
  defaultExpanded: boolean;
  /** Slim rows for low-priority home sections — smaller chevron; title uses peer card scale and padding. */
  density?: "default" | "slim";
  description?: ReactNode;
  collapsedSummary?: ReactNode;
  headerAside?: ReactNode;
  sectionClassName?: string;
  bodyClassName?: string;
  sectionDataAttributes?: Record<string, string>;
  /** When true and `titleId` is set, matching `location.hash` expands the section after hydration. */
  autoExpandOnHashMatch?: boolean;
  /** Optional hash matcher; defaults to `location.hash` id equals `titleId`. */
  deepLinkHashMatches?: (hash: string) => boolean;
  children: ReactNode;
};

/** Consistent operator-home collapsible: title row, optional collapsed summary, chevron toggle. */
export function OperatorHomeDisclosureSection(props: OperatorHomeDisclosureSectionProps): React.JSX.Element {
  const {
    title,
    titleHref,
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
    autoExpandOnHashMatch = false,
    deepLinkHashMatches,
    children,
  } = props;

  const trimmedTitleHref = titleHref?.trim() ?? "";
  const hasTitleHref = trimmedTitleHref.length > 0;

  const generatedTitleId = useId().replaceAll(":", "");
  const titleId = titleIdProp ?? generatedTitleId;
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const matchesDeepLinkHash = useCallback(
    (hash: string): boolean => {
      if (deepLinkHashMatches !== undefined) {
        return deepLinkHashMatches(hash);
      }

      return hash.replace(/^#/, "").trim() === titleIdProp;
    },
    [deepLinkHashMatches, titleIdProp],
  );

  const scrollToDeepLinkTarget = useCallback(() => {
    if (!autoExpandOnHashMatch || titleIdProp === undefined || titleIdProp.trim() === "") {
      return;
    }

    scheduleScrollDeepLinkTargetIntoView(titleIdProp);
  }, [autoExpandOnHashMatch, titleIdProp]);

  useLayoutEffect(() => {
    let nextExpanded = readOperatorHomeDisclosureExpanded(storageKey, defaultExpanded, legacyStorageKeys);
    let shouldScrollToHashTarget = false;

    if (autoExpandOnHashMatch && titleIdProp !== undefined && titleIdProp.trim() !== "") {
      const hash = typeof window !== "undefined" ? window.location.hash : "";

      if (matchesDeepLinkHash(hash)) {
        nextExpanded = true;
        writeOperatorHomeDisclosureExpanded(storageKey, true);
        shouldScrollToHashTarget = true;
      }
    }

    setExpanded(nextExpanded);
    setHydrated(true);

    if (shouldScrollToHashTarget) {
      scrollToDeepLinkTarget();
    }
  }, [
    autoExpandOnHashMatch,
    defaultExpanded,
    legacyStorageKeys,
    matchesDeepLinkHash,
    scrollToDeepLinkTarget,
    storageKey,
    titleIdProp,
  ]);

  const persistExpanded = useCallback(
    (nextExpanded: boolean) => {
      setExpanded(nextExpanded);
      writeOperatorHomeDisclosureExpanded(storageKey, nextExpanded);
    },
    [storageKey],
  );

  useEffect(() => {
    if (!autoExpandOnHashMatch || titleIdProp === undefined || titleIdProp.trim() === "") {
      return;
    }

    const onHashChange = () => {
      if (matchesDeepLinkHash(window.location.hash)) {
        persistExpanded(true);
        scrollToDeepLinkTarget();
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [autoExpandOnHashMatch, matchesDeepLinkHash, persistExpanded, scrollToDeepLinkTarget, titleIdProp]);

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
        sectionClassName,
      )}
      data-testid={sectionTestId}
      data-disclosure-expanded={hydrated ? String(expanded) : undefined}
      {...sectionDataAttributes}
    >
      <div className={cn(OPERATOR_CARD.header, "flex flex-row items-start justify-between gap-3 pb-0")}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OperatorHomeCardSectionTitle id={titleId}>
              {hasTitleHref ? (
                <Link href={trimmedTitleHref} className={cn(OPERATOR_LINK.inline, "font-inherit")}>
                  {title}
                </Link>
              ) : (
                title
              )}
            </OperatorHomeCardSectionTitle>
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
                "m-0 text-neutral-600 dark:text-neutral-400",
                slim ? cn("mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper) : cn("mt-2", OPERATOR_TYPOGRAPHY.body),
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
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
        <div id={`${titleId}-panel`} className={cn(OPERATOR_CARD.content, bodyClassName)}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
