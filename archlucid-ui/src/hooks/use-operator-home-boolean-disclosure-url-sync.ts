"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
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
  const pathname = usePathname() ?? "/";
  const readOpenFromUrl = (): boolean | null => {
    const param = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(paramName);

    if (param === null) {
      return null;
    }

    return parseOpenFromSearch(param);
  };
  const [expanded, setExpandedState] = useState(() => {
    const fromUrl = readOpenFromUrl();

    if (fromUrl !== null) {
      return fromUrl;
    }

    return readOperatorHomeDisclosureExpanded(storageKey, defaultExpanded, legacyStorageKeys);
  });
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  const setExpanded = useCallback(
    (open: boolean) => {
      if (expandedRef.current === open) {
        return;
      }

      expandedRef.current = open;
      setExpandedState(open);
      writeOperatorHomeDisclosureExpanded(storageKey, open);
      commitHrefIfChanged(disclosureHrefFromSearch(readWindowLocationSearch(), open, pathname), { notify: false });
    },
    [disclosureHrefFromSearch, paramName, pathname, storageKey],
  );

  useEffect(() => {
    const syncExpandedFromUrl = (): void => {
      const fromUrl = readOpenFromUrl();

      if (fromUrl === null) {
        return;
      }

      if (expandedRef.current === fromUrl) {
        return;
      }

      expandedRef.current = fromUrl;
      setExpandedState(fromUrl);
    };

    syncExpandedFromUrl();
    window.addEventListener("popstate", syncExpandedFromUrl);

    return () => {
      window.removeEventListener("popstate", syncExpandedFromUrl);
    };
  }, [paramName, parseOpenFromSearch]);

  return [expanded, setExpanded];
}
