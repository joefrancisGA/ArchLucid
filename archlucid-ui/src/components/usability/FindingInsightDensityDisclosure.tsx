"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  findingInsightDensityDisclosureHrefFromSearch,
  parseFindingInsightDensityOpenFromSearch,
} from "@/lib/findings/finding-insight-density-disclosure-url";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";

export type FindingInsightDensityDisclosureProps = {
  readonly insightDensityScore: number | null;
  readonly whyThisIsNotGeneric: string | null;
  readonly className?: string;
};

/** Optional insight-density fields behind disclosure on finding detail surfaces. */
export function FindingInsightDensityDisclosure(props: FindingInsightDensityDisclosureProps): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const [open, setOpenState] = useState(() =>
    parseFindingInsightDensityOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("findingInsightDensityOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;
  const hasScore = props.insightDensityScore !== null && Number.isFinite(props.insightDensityScore);
  const whyText = props.whyThisIsNotGeneric?.trim() ?? "";

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        findingInsightDensityDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseFindingInsightDensityOpenFromSearch(
        new URLSearchParams(window.location.search).get("findingInsightDensityOpen"),
      );

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  if (!hasScore && whyText.length === 0) {
    return null;
  }

  return (
    <details
      className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40", props.className)}
      data-testid="finding-insight-density-disclosure"
      open={open}
      onToggle={(event) => {
        event.preventDefault();
        setOpen(!openRef.current);
      }}
    >
      <summary className={cn("cursor-pointer font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Insight density signals
      </summary>
      <dl className={cn("m-0 mt-2 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
        {hasScore ? (
          <div>
            <dt className="font-semibold text-al-text-primary">Insight density score</dt>
            <dd className="m-0 tabular-nums text-al-text-secondary">{Math.trunc(props.insightDensityScore ?? 0)}</dd>
          </div>
        ) : null}
        {whyText.length > 0 ? (
          <div>
            <dt className="font-semibold text-al-text-primary">Why this is not generic</dt>
            <dd className="m-0 leading-relaxed text-al-text-secondary">{whyText}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold text-al-text-primary">Typed-engine insight density</dt>
          <dd
            className="m-0 leading-relaxed text-al-text-secondary"
            data-testid="finding-insight-density-typed-engine-honesty"
          >
            {INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE}
          </dd>
        </div>
      </dl>
    </details>
  );
}
