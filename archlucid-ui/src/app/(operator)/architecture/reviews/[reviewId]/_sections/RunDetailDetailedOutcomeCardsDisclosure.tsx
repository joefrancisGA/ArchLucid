"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM,
  parseRunDetailOutcomeCardsOpenFromSearch,
  runDetailOutcomeCardsDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-outcome-cards-disclosure-url";

type RunDetailDetailedOutcomeCardsDisclosureProps = {
  readonly children: ReactNode;
};

export function RunDetailDetailedOutcomeCardsDisclosure(
  props: RunDetailDetailedOutcomeCardsDisclosureProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlOpen = parseRunDetailOutcomeCardsOpenFromSearch(
    searchParams.get(RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM),
  );
  const [open, setOpenState] = useState(urlOpen);
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runDetailOutcomeCardsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname, searchParams],
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
      const next = parseRunDetailOutcomeCardsOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_DETAIL_OUTCOME_CARDS_OPEN_PARAM),
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

  useEffect(() => {
    if (openRef.current === urlOpen) {
      return;
    }

    openRef.current = urlOpen;
    setOpenState(urlOpen);
  }, [urlOpen]);

  return (
    <details
      className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      open={open}
      data-testid="run-detail-detailed-outcome-cards"
      onToggle={(event) => {
        event.preventDefault();
        setOpen(!openRef.current);
      }}
    >
      <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
      <div className="mt-3">{props.children}</div>
    </details>
  );
}
