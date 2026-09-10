"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import {
  helpConfigurationReferenceCatalogDisclosureHrefFromSearch,
  parseHelpConfigurationReferenceCatalogOpenFromSearch,
} from "@/lib/help/help-configuration-reference-catalog-disclosure-url";

type HelpConfigurationReferenceCatalogDisclosureProps = {
  readonly summary: ReactNode;
  readonly preface: ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly bodyClassName?: string;
  readonly children: ReactNode;
};

/** Configuration-reference key catalog appendix synced to URL (server-safe wrapper). */
export function HelpConfigurationReferenceCatalogDisclosure(
  props: HelpConfigurationReferenceCatalogDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const openParam = searchParams.get("helpConfigurationReferenceCatalogOpen");
  const [open, setOpenState] = useState(() => parseHelpConfigurationReferenceCatalogOpenFromSearch(openParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpConfigurationReferenceCatalogDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseHelpConfigurationReferenceCatalogOpenFromSearch(openParam));
  }, [openParam]);

  return (
    <HelpLazyDetails
      summary={props.summary}
      preface={props.preface}
      className={props.className}
      summaryClassName={props.summaryClassName}
      bodyClassName={props.bodyClassName}
      data-testid="help-configuration-reference-catalog-appendix"
      bodyTestId="help-configuration-reference-content"
      open={open}
      onOpenChange={setOpen}
    >
      {props.children}
    </HelpLazyDetails>
  );
}
