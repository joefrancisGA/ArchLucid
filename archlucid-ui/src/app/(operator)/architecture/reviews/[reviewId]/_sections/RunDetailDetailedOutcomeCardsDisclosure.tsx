"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseRunDetailOutcomeCardsOpenFromSearch,
  runDetailOutcomeCardsDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-outcome-cards-disclosure-url";

type RunDetailDetailedOutcomeCardsDisclosureProps = {
  readonly children: ReactNode;
};

export function RunDetailDetailedOutcomeCardsDisclosure(
  props: RunDetailDetailedOutcomeCardsDisclosureProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runDetailOutcomeCardsOpenParam = searchParams.get("runDetailOutcomeCardsOpen");
  const [open, setOpenState] = useState(() =>
    parseRunDetailOutcomeCardsOpenFromSearch(runDetailOutcomeCardsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runDetailOutcomeCardsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunDetailOutcomeCardsOpenFromSearch(runDetailOutcomeCardsOpenParam));
  }, [runDetailOutcomeCardsOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      open={open}
      data-testid="run-detail-detailed-outcome-cards"
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
      <div className="mt-3">{props.children}</div>
    </details>
  );
}
