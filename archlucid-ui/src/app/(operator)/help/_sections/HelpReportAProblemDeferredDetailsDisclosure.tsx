"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import {
  helpReportAProblemDeferredDetailsDisclosureHrefFromSearch,
  parseHelpReportAProblemDeferredDetailsOpenFromSearch,
} from "@/lib/help/help-report-a-problem-deferred-details-disclosure-url";

type HelpReportAProblemDeferredDetailsDisclosureProps = {
  readonly summary: ReactNode;
  readonly detailsTestId: string;
  readonly bodyTestId: string;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly bodyClassName?: string;
  readonly children: ReactNode;
};

/** Report-a-problem help deferred markdown body synced to URL. */
export function HelpReportAProblemDeferredDetailsDisclosure(
  props: HelpReportAProblemDeferredDetailsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpReportAProblemDeferredDetailsOpenParam = searchParams.get("helpReportAProblemDeferredDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parseHelpReportAProblemDeferredDetailsOpenFromSearch(helpReportAProblemDeferredDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpReportAProblemDeferredDetailsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseHelpReportAProblemDeferredDetailsOpenFromSearch(helpReportAProblemDeferredDetailsOpenParam));
  }, [helpReportAProblemDeferredDetailsOpenParam]);

  return (
    <HelpLazyDetails
      summary={props.summary}
      data-testid={props.detailsTestId}
      bodyTestId={props.bodyTestId}
      className={props.className}
      summaryClassName={props.summaryClassName}
      bodyClassName={props.bodyClassName}
      open={open}
      onOpenChange={setOpen}
    >
      {props.children}
    </HelpLazyDetails>
  );
}
