"use client";

import type { ReactNode, ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  RUN_TECHNICAL_DETAILS_OPEN_PARAM,
  parseRunTechnicalDetailsOpenFromSearch,
  runDetailOperatorTechnicalDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-operator-technical-disclosure-url";

type RunDetailOperatorTechnicalDisclosureProps = {
  readonly children: ReactNode;
};

/** Operator run detail: LLM cost, agent logs, traces, and metadata default closed. */
export function RunDetailOperatorTechnicalDisclosure(
  props: RunDetailOperatorTechnicalDisclosureProps,
): ReactElement {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlTechnicalDetailsOpen = parseRunTechnicalDetailsOpenFromSearch(
    searchParams.get(RUN_TECHNICAL_DETAILS_OPEN_PARAM),
  );
  const [open, setOpenState] = useState(urlTechnicalDetailsOpen);
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runDetailOperatorTechnicalDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
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
      const nextOpen = parseRunTechnicalDetailsOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_TECHNICAL_DETAILS_OPEN_PARAM),
      );

      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    if (openRef.current === urlTechnicalDetailsOpen) {
      return;
    }

    openRef.current = urlTechnicalDetailsOpen;
    setOpenState(urlTechnicalDetailsOpen);
  }, [urlTechnicalDetailsOpen]);

  return (
    <div data-testid="run-detail-advanced-options">
      <AdvancedOptionsAccordion
        triggerLabel="Technical details"
        open={open}
        onOpenChange={setOpen}
        className="scroll-mt-24"
      >
        <div className="space-y-4">{props.children}</div>
      </AdvancedOptionsAccordion>
    </div>
  );
}
