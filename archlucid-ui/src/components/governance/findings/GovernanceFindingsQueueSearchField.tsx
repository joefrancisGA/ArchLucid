"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS } from "@/lib/design-tokens";
import {
  patchGovernanceFindingsQueueFacets,
  readGovernanceFindingsQueueFacets,
} from "@/lib/governance/governance-findings-queue-facets-storage";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import {
  governanceFindingsSearchHrefFromSearch,
  parseGovernanceFindingsSearchQuery,
} from "@/lib/governance/governance-findings-queue-search";

export type GovernanceFindingsQueueSearchFieldProps = {
  readonly placeholder?: string;
  readonly mode?: GovernanceFindingsQueueMode;
};

/** In-page findings queue search bound to `?q=` (mirrors shell header search). */
export function GovernanceFindingsQueueSearchField(
  props: GovernanceFindingsQueueSearchFieldProps,
): React.JSX.Element {
  const mode = props.mode ?? "tenant";
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlSearchQuery = parseGovernanceFindingsSearchQuery(searchParams.get("q"));
  const [searchQuery, setSearchQuery] = useState(() => {
    if (searchParams.has("q")) {
      return urlSearchQuery;
    }

    return readGovernanceFindingsQueueFacets(mode).searchQuery;
  });

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      patchGovernanceFindingsQueueFacets({ searchQuery }, mode);
      const nextHref = governanceFindingsSearchHrefFromSearch(searchParams.toString(), searchQuery, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [mode, pathname, router, searchParams, searchQuery]);

  return (
    <div className="min-w-0 flex-1 basis-[14rem] sm:max-w-xs lg:max-w-sm">
      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={props.placeholder ?? "Search findings…"}
        aria-label={props.placeholder ?? "Search findings"}
        className={OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS}
        data-testid="governance-findings-queue-search"
      />
    </div>
  );
}
