"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  helpCaiqSigResponseSigDeferredDisclosureHrefFromSearch,
  parseHelpCaiqSigResponseSigDeferredOpenFromSearch,
} from "@/lib/help/help-caiq-sig-response-sig-deferred-disclosure-url";

type HelpCaiqSigResponseSigDeferredDisclosureProps = {
  readonly summary: ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly bodyClassName?: string;
  readonly detailsTestId: string;
  readonly bodyTestId: string;
  readonly markdownBody: string;
  readonly tableCaption: string;
  readonly sourceDocPath: string;
  readonly helpTopicSlug: string;
  readonly preparedMarkdownOverride: string;
};

/** CAIQ/SIG deferred markdown appendix synced to URL (server-safe wrapper). */
export function HelpCaiqSigResponseSigDeferredDisclosure(
  props: HelpCaiqSigResponseSigDeferredDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpCaiqSigResponseSigDeferredOpenParam = searchParams.get("helpCaiqSigResponseSigDeferredOpen");
  const [open, setOpenState] = useState(() =>
    parseHelpCaiqSigResponseSigDeferredOpenFromSearch(helpCaiqSigResponseSigDeferredOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpCaiqSigResponseSigDeferredDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseHelpCaiqSigResponseSigDeferredOpenFromSearch(helpCaiqSigResponseSigDeferredOpenParam));
  }, [helpCaiqSigResponseSigDeferredOpenParam]);

  return (
    <HelpLazyDetails
      className={props.className}
      summaryClassName={props.summaryClassName}
      bodyClassName={props.bodyClassName}
      summary={props.summary}
      data-testid={props.detailsTestId}
      bodyTestId={props.bodyTestId}
      open={open}
      onOpenChange={setOpen}
    >
      <MarketingAccessibilityMarkdownFragment
        markdownBody={props.markdownBody}
        tableCaption={props.tableCaption}
        presentation="help"
        sourceDocPath={props.sourceDocPath}
        helpTopicSlug={props.helpTopicSlug}
        preparedMarkdownOverride={props.preparedMarkdownOverride}
      />
    </HelpLazyDetails>
  );
}
