"use client";

import type { ReactNode, ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
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
  const [open, setOpenState] = useState(() =>
    parseRunTechnicalDetailsOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runTechnicalDetailsOpen"),
    ),
  );
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
        new URLSearchParams(window.location.search).get("runTechnicalDetailsOpen"),
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
