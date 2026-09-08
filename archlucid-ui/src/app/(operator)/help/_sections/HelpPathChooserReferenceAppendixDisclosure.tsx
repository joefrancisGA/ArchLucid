"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import {
  helpPathChooserReferenceAppendixDisclosureHrefFromSearch,
  parseHelpPathChooserReferenceAppendixOpenFromSearch,
} from "@/lib/help/help-path-chooser-reference-appendix-disclosure-url";

type HelpPathChooserReferenceAppendixDisclosureProps = {
  readonly summary: ReactNode;
  readonly preface: ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly bodyClassName?: string;
  readonly children: ReactNode;
};

/** Path-chooser help reference appendix synced to URL (server-safe wrapper). */
export function HelpPathChooserReferenceAppendixDisclosure(
  props: HelpPathChooserReferenceAppendixDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const openParam = searchParams.get("helpPathChooserReferenceAppendixOpen");
  const [open, setOpenState] = useState(() => parseHelpPathChooserReferenceAppendixOpenFromSearch(openParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpPathChooserReferenceAppendixDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseHelpPathChooserReferenceAppendixOpenFromSearch(openParam));
  }, [openParam]);

  return (
    <HelpLazyDetails
      summary={props.summary}
      preface={props.preface}
      className={props.className}
      summaryClassName={props.summaryClassName}
      bodyClassName={props.bodyClassName}
      data-testid="help-path-chooser-reference-appendix"
      open={open}
      onOpenChange={setOpen}
    >
      {props.children}
    </HelpLazyDetails>
  );
}
