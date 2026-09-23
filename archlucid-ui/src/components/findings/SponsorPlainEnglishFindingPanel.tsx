"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildSponsorPlainEnglishFinding,
  type SponsorPlainEnglishFindingInput,
} from "@/lib/sponsor-plain-english-finding";
import {
  findingSponsorPlainEnglishDisclosureHrefFromSearch,
  parseFindingSponsorPlainEnglishOpenFromSearch,
} from "@/lib/findings/sponsor-plain-english-finding-disclosure-url";
import { cn } from "@/lib/utils";

export type SponsorPlainEnglishFindingPanelProps = {
  readonly input: SponsorPlainEnglishFindingInput;
  /** When true (default), content starts collapsed behind "Explain for a sponsor". */
  readonly collapsedByDefault?: boolean;
  readonly className?: string;
  readonly testId?: string;
};

/**
 * Sponsor-facing plain-English rewrite of a finding (TB-2192).
 * Template rewrite only — distinct from TB-2154 derivation and FindingExplainPanel audit.
 */
export function SponsorPlainEnglishFindingPanel(
  props: SponsorPlainEnglishFindingPanelProps,
): ReactElement {
  const {
    input,
    collapsedByDefault = true,
    className,
    testId = "sponsor-plain-english-finding",
  } = props;
  const pathname = usePathname() ?? "/";
  const [panelOpen, setPanelOpenState] = useState(() =>
    parseFindingSponsorPlainEnglishOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("findingSponsorPlainEnglishOpen"),
    ),
  );
  const panelOpenRef = useRef(panelOpen);
  panelOpenRef.current = panelOpen;
  const rewrite = buildSponsorPlainEnglishFinding(input);

  const syncPanelOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        findingSponsorPlainEnglishDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setPanelOpen = useCallback(
    (open: boolean) => {
      if (panelOpenRef.current === open) {
        return;
      }

      panelOpenRef.current = open;
      setPanelOpenState(open);
      syncPanelOpenToUrl(open);
    },
    [syncPanelOpenToUrl],
  );

  useEffect(() => {
    const syncPanelOpenFromUrl = (): void => {
      const next = parseFindingSponsorPlainEnglishOpenFromSearch(
        new URLSearchParams(window.location.search).get("findingSponsorPlainEnglishOpen"),
      );

      if (panelOpenRef.current === next) {
        return;
      }

      panelOpenRef.current = next;
      setPanelOpenState(next);
    };

    syncPanelOpenFromUrl();
    window.addEventListener("popstate", syncPanelOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPanelOpenFromUrl);
    };
  }, []);

  const body = (
    <div className="space-y-2" data-testid={`${testId}-body`}>
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {rewrite.headline}
      </p>
      <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {rewrite.plainEnglish}
      </p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testId}-caution`}>
        {rewrite.sponsorCaution}
      </p>
    </div>
  );

  if (!collapsedByDefault) {
    return (
      <section
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800",
          className,
        )}
        data-testid={testId}
        aria-label="Explain for a sponsor"
      >
        <p className={cn("m-0 mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Explain for a sponsor
        </p>
        {body}
      </section>
    );
  }

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      data-testid={testId}
      open={panelOpen}
      onToggle={(event) => {
        event.preventDefault();
        setPanelOpen(!panelOpenRef.current);
      }}
    >
      <summary className={cn("cursor-pointer select-none font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Explain for a sponsor
      </summary>
      <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">{body}</div>
    </details>
  );
}
