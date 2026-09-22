"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

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
  readonly id?: string;
  readonly initialOpen?: boolean;
  readonly onBodyMount?: (element: HTMLElement) => void;
};

/** Configuration-reference key catalog appendix synced to URL (server-safe wrapper). */
export function HelpConfigurationReferenceCatalogDisclosure(
  props: HelpConfigurationReferenceCatalogDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const openParam = searchParams.get("helpConfigurationReferenceCatalogOpen");
  const hasAppliedInitialOpen = useRef(false);
  const [open, setOpenState] = useState(
    () => props.initialOpen === true || parseHelpConfigurationReferenceCatalogOpenFromSearch(openParam),
  );

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
    if (!hasAppliedInitialOpen.current) {
      hasAppliedInitialOpen.current = true;
      return;
    }

    setOpenState(
      parseHelpConfigurationReferenceCatalogOpenFromSearch(openParam),
    );
  }, [openParam]);

  return (
    <HelpLazyDetails
      id={props.id}
      summary={props.summary}
      preface={props.preface}
      className={props.className}
      summaryClassName={props.summaryClassName}
      bodyClassName={props.bodyClassName}
      data-testid="help-configuration-reference-catalog-appendix"
      bodyTestId="help-configuration-reference-content"
      open={open}
      onOpenChange={setOpen}
      mountOnHash
    >
      <CatalogBodyMount onMount={props.onBodyMount}>{props.children}</CatalogBodyMount>
    </HelpLazyDetails>
  );
}

function CatalogBodyMount(props: {
  readonly children: ReactNode;
  readonly onMount?: (element: HTMLElement) => void;
}): ReactElement {
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      if (element !== null) {
        props.onMount?.(element);
      }
    },
    [props.onMount],
  );

  return <div ref={ref}>{props.children}</div>;
}
