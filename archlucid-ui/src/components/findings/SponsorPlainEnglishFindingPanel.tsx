"use client";

import type { ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingSponsorPlainEnglishOpenParam = searchParams.get("findingSponsorPlainEnglishOpen");
  const [panelOpen, setPanelOpenState] = useState(() =>
    parseFindingSponsorPlainEnglishOpenFromSearch(findingSponsorPlainEnglishOpenParam),
  );
  const rewrite = buildSponsorPlainEnglishFinding(input);

  const syncPanelOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        findingSponsorPlainEnglishDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPanelOpen = useCallback(
    (open: boolean) => {
      setPanelOpenState(open);
      syncPanelOpenToUrl(open);
    },
    [syncPanelOpenToUrl],
  );

  useEffect(() => {
    setPanelOpenState(parseFindingSponsorPlainEnglishOpenFromSearch(findingSponsorPlainEnglishOpenParam));
  }, [findingSponsorPlainEnglishOpenParam]);

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
        setPanelOpen(event.currentTarget.open);
      }}
    >
      <summary className={cn("cursor-pointer select-none font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Explain for a sponsor
      </summary>
      <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">{body}</div>
    </details>
  );
}
