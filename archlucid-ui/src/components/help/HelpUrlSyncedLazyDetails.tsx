"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { HelpLazyDetails, type HelpLazyDetailsProps } from "@/components/help/HelpLazyDetails";

type HelpUrlSyncedLazyDetailsProps = Omit<HelpLazyDetailsProps, "open" | "onOpenChange"> & {
  readonly paramName: string;
  readonly parseOpenFromSearch: (raw: string | null | undefined) => boolean;
  readonly disclosureHrefFromSearch: (currentSearch: string, open: boolean, pathname: string) => string;
};

/** HelpLazyDetails with URL-synced open state for shareable operator help disclosures. */
export function HelpUrlSyncedLazyDetails(props: HelpUrlSyncedLazyDetailsProps): ReactElement {
  const { paramName, parseOpenFromSearch, disclosureHrefFromSearch, ...lazyDetailsProps } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const openParam = searchParams.get(paramName);
  const [open, setOpenState] = useState(() => parseOpenFromSearch(openParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(disclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), { scroll: false });
    },
    [disclosureHrefFromSearch, pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseOpenFromSearch(openParam));
  }, [openParam, parseOpenFromSearch]);

  return <HelpLazyDetails {...lazyDetailsProps} open={open} onOpenChange={setOpen} />;
}
