"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator/operator-home-disclosure-storage";

/** Operator-home disclosure expansion synced to a boolean search param and localStorage. */
export function useOperatorHomeBooleanDisclosureUrlSync(
  storageKey: string,
  paramName: string,
  parseOpenFromSearch: (raw: string | null | undefined) => boolean,
  disclosureHrefFromSearch: (currentSearch: string, open: boolean, pathname: string) => string,
  defaultExpanded = false,
  legacyStorageKeys: readonly string[] = [],
): [boolean, (open: boolean) => void] {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const openParam = searchParams.get(paramName);
  const [expanded, setExpandedState] = useState(() => {
    if (parseOpenFromSearch(openParam)) {
      return true;
    }

    return readOperatorHomeDisclosureExpanded(storageKey, defaultExpanded, legacyStorageKeys);
  });

  const setExpanded = useCallback(
    (open: boolean) => {
      setExpandedState(open);
      writeOperatorHomeDisclosureExpanded(storageKey, open);
      router.replace(disclosureHrefFromSearch(searchParams.toString(), open, pathname), { scroll: false });
    },
    [disclosureHrefFromSearch, pathname, router, searchParams, storageKey],
  );

  useEffect(() => {
    setExpandedState(parseOpenFromSearch(openParam));
  }, [openParam, parseOpenFromSearch]);

  return [expanded, setExpanded];
}
