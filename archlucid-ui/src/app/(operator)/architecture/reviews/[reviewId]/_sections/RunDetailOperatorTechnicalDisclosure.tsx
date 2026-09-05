"use client";

import type { ReactNode, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runTechnicalDetailsOpenParam = searchParams.get("runTechnicalDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parseRunTechnicalDetailsOpenFromSearch(runTechnicalDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        runDetailOperatorTechnicalDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
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
    setOpenState(parseRunTechnicalDetailsOpenFromSearch(runTechnicalDetailsOpenParam));
  }, [runTechnicalDetailsOpenParam]);

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
