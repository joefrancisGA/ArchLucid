"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import {
  helpTroubleshootingAdvancedDiagnosticsDisclosureHrefFromSearch,
  parseHelpTroubleshootingAdvancedDiagnosticsOpenFromSearch,
} from "@/lib/help/help-troubleshooting-advanced-diagnostics-disclosure-url";

type HelpTroubleshootingAdvancedDiagnosticsDisclosureProps = {
  readonly summary: ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly bodyClassName?: string;
  readonly children: ReactNode;
};

/** Troubleshooting advanced diagnostics disclosure synced to URL (server-safe wrapper). */
export function HelpTroubleshootingAdvancedDiagnosticsDisclosure(
  props: HelpTroubleshootingAdvancedDiagnosticsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const openParam = searchParams.get("helpTroubleshootingAdvancedDiagnosticsOpen");
  const [open, setOpenState] = useState(() => parseHelpTroubleshootingAdvancedDiagnosticsOpenFromSearch(openParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpTroubleshootingAdvancedDiagnosticsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseHelpTroubleshootingAdvancedDiagnosticsOpenFromSearch(openParam));
  }, [openParam]);

  return (
    <HelpLazyDetails
      id="advanced-diagnostics"
      summary={props.summary}
      className={props.className}
      summaryClassName={props.summaryClassName}
      bodyClassName={props.bodyClassName}
      data-testid="troubleshooting-advanced-diagnostics"
      open={open}
      onOpenChange={setOpen}
    >
      {props.children}
    </HelpLazyDetails>
  );
}
