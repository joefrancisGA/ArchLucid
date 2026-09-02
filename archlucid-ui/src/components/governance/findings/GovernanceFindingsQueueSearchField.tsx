"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS } from "@/lib/design-tokens";
import {
  governanceFindingsSearchHrefFromSearch,
  parseGovernanceFindingsSearchQuery,
} from "@/lib/governance/governance-findings-queue-search";

export type GovernanceFindingsQueueSearchFieldProps = {
  readonly placeholder?: string;
};

/** In-page findings queue search bound to `?q=` (mirrors shell header search). */
export function GovernanceFindingsQueueSearchField(
  props: GovernanceFindingsQueueSearchFieldProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlSearchQuery = parseGovernanceFindingsSearchQuery(searchParams.get("q"));
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = governanceFindingsSearchHrefFromSearch(searchParams.toString(), searchQuery, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, router, searchParams, searchQuery]);

  return (
    <div className="min-w-0 flex-1 basis-[14rem] sm:max-w-xs lg:max-w-sm">
      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && searchQuery.trim().length > 0) {
            event.preventDefault();
            setSearchQuery("");
          }
        }}
        placeholder={props.placeholder ?? "Search findings…"}
        aria-label={props.placeholder ?? "Search findings"}
        className={OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS}
        data-testid="governance-findings-queue-search"
      />
    </div>
  );
}
