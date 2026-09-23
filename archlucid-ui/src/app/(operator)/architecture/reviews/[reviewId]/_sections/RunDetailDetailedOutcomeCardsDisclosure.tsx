"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRunDetailOutcomeCardsOpenFromSearch,
  runDetailOutcomeCardsDisclosureHrefFromSearch} from "@/lib/runs/run-detail-outcome-cards-disclosure-url";

type RunDetailDetailedOutcomeCardsDisclosureProps = {
  readonly children: ReactNode;
};

export function RunDetailDetailedOutcomeCardsDisclosure(
  props: RunDetailDetailedOutcomeCardsDisclosureProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const [open, setOpenState] = useState(() =>
    parseRunDetailOutcomeCardsOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runDetailOutcomeCardsOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runDetailOutcomeCardsDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
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
      const next = parseRunDetailOutcomeCardsOpenFromSearch(
        new URLSearchParams(window.location.search).get("runDetailOutcomeCardsOpen"),
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
