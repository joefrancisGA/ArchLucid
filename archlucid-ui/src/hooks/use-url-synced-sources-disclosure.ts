"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get(input.searchParamKey);
  const hasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const workspacePreCommit = !hasCommittedArchitectureReview;
  const userDismissed = useMemo(
    () => readOrientationSourcesAutoOpenDismissed(input.surfaceId),
    [input.surfaceId],
  );
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    resolveOrientationSourcesInitialOpen({
      urlParamOpen: input.parseOpenFromSearch(sourcesOpenParam),
      userDismissed,
      workspacePreCommit,
    }),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(input.disclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [input, pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);

      if (!open) {
        writeOrientationSourcesAutoOpenDismissed(input.surfaceId);
      }
    },
    [input.surfaceId, syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(
      resolveOrientationSourcesInitialOpen({
        urlParamOpen: input.parseOpenFromSearch(sourcesOpenParam),
        userDismissed: readOrientationSourcesAutoOpenDismissed(input.surfaceId),
        workspacePreCommit,
      }),
    );
  }, [input, sourcesOpenParam, workspacePreCommit]);

  return {
    sourcesOpen,
    setSourcesOpen,
  };
}
