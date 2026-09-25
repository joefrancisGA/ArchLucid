"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  readOrientationSourcesAutoOpenDismissed,
  resolveOrientationSourcesInitialOpen,
  writeOrientationSourcesAutoOpenDismissed,
} from "@/lib/usability/orientation-sources-auto-open-preference";

type UseUrlSyncedSourcesDisclosureInput = {
  readonly surfaceId: string;
  readonly searchParamKey: string;
  readonly parseOpenFromSearch: (value: string | null) => boolean;
  readonly disclosureHrefFromSearch: (
    currentSearch: string,
    open: boolean,
    pathname: string,
  ) => string;
};

export function useUrlSyncedSourcesDisclosure(
  input: UseUrlSyncedSourcesDisclosureInput,
): {
  readonly sourcesOpen: boolean;
  readonly setSourcesOpen: (open: boolean) => void;
} {
  const pathname = usePathname() ?? "/";
  const hasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const workspacePreCommit = !hasCommittedArchitectureReview;
  const userDismissed = useMemo(
    () => readOrientationSourcesAutoOpenDismissed(input.surfaceId),
    [input.surfaceId],
  );
  const readSourcesOpenFromUrl = (): boolean | null => {
    const param = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
      input.searchParamKey,
    );

    if (param === null) {
      return null;
    }

    return input.parseOpenFromSearch(param);
  };
  const [sourcesOpen, setSourcesOpenState] = useState(() => {
    const fromUrl = readSourcesOpenFromUrl();

    if (fromUrl !== null) {
      return fromUrl;
    }

    return resolveOrientationSourcesInitialOpen({
      urlParamOpen: input.parseOpenFromSearch(null),
      userDismissed,
      workspacePreCommit,
    });
  });
  const sourcesOpenRef = useRef(sourcesOpen);
  sourcesOpenRef.current = sourcesOpen;

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        input.disclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [input, pathname],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      if (sourcesOpenRef.current === open) {
        return;
      }

      sourcesOpenRef.current = open;
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);

      if (!open) {
        writeOrientationSourcesAutoOpenDismissed(input.surfaceId);
      }
    },
    [input.surfaceId, syncSourcesOpenToUrl],
  );

  useEffect(() => {
    const syncSourcesOpenFromUrl = (): void => {
      const fromUrl = readSourcesOpenFromUrl();

      if (fromUrl !== null) {
        if (sourcesOpenRef.current !== fromUrl) {
          sourcesOpenRef.current = fromUrl;
          setSourcesOpenState(fromUrl);
        }

        return;
      }

      const next = resolveOrientationSourcesInitialOpen({
        urlParamOpen: input.parseOpenFromSearch(null),
        userDismissed: readOrientationSourcesAutoOpenDismissed(input.surfaceId),
        workspacePreCommit,
      });

      if (sourcesOpenRef.current !== next) {
        sourcesOpenRef.current = next;
        setSourcesOpenState(next);
      }
    };

    syncSourcesOpenFromUrl();
    window.addEventListener("popstate", syncSourcesOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncSourcesOpenFromUrl);
    };
  }, [input, workspacePreCommit]);

  return {
    sourcesOpen,
    setSourcesOpen,
  };
}
