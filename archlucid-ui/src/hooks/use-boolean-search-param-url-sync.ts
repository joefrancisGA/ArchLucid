"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

/** Boolean disclosure open state synced to a search param without App Router soft navigation. */
export function useBooleanSearchParamUrlSync(
  paramName: string,
  parseOpenFromSearch: (raw: string | null | undefined) => boolean,
  disclosureHrefFromSearch: (currentSearch: string, open: boolean, pathname: string) => string,
): [boolean, (open: boolean) => void] {
  const pathname = usePathname() ?? "/";
  const readOpenFromUrl = (): boolean | null => {
    const param = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(paramName);

    if (param === null) {
      return null;
    }

    return parseOpenFromSearch(param);
  };
  const [open, setOpenState] = useState(() => {
    const fromUrl = readOpenFromUrl();

    if (fromUrl !== null) {
      return fromUrl;
    }

    return parseOpenFromSearch(null);
  });
  const openRef = useRef(open);
  openRef.current = open;

  const setOpen = useCallback(
    (next: boolean) => {
      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
      commitHrefIfChanged(disclosureHrefFromSearch(readWindowLocationSearch(), next, pathname), { notify: false });
    },
    [disclosureHrefFromSearch, pathname],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const fromUrl = readOpenFromUrl();

      if (fromUrl === null) {
        return;
      }

      if (openRef.current === fromUrl) {
        return;
      }

      openRef.current = fromUrl;
      setOpenState(fromUrl);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, [paramName, parseOpenFromSearch]);

  return [open, setOpen];
}
