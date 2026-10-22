"use client";

import { type ReactElement } from "react";

import { HelpLazyDetails, type HelpLazyDetailsProps } from "@/components/help/HelpLazyDetails";
import { useBooleanSearchParamUrlSync } from "@/hooks/use-boolean-search-param-url-sync";

type HelpUrlSyncedLazyDetailsProps = Omit<HelpLazyDetailsProps, "open" | "onOpenChange"> & {
  readonly paramName: string;
  readonly parseOpenFromSearch: (raw: string | null | undefined) => boolean;
  readonly disclosureHrefFromSearch: (currentSearch: string, open: boolean, pathname: string) => string;
};

/** HelpLazyDetails with URL-synced open state for shareable operator help disclosures. */
export function HelpUrlSyncedLazyDetails(props: HelpUrlSyncedLazyDetailsProps): ReactElement {
  const { paramName, parseOpenFromSearch, disclosureHrefFromSearch, ...lazyDetailsProps } = props;
  const [open, setOpen] = useBooleanSearchParamUrlSync(paramName, parseOpenFromSearch, disclosureHrefFromSearch);

  return <HelpLazyDetails {...lazyDetailsProps} open={open} onOpenChange={setOpen} />;
}
