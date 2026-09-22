"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { fetchUserPreferencesFromApi } from "@/lib/api/user-preferences-cache";
import {
  applyWorkingWorkspaceContinuityFromServer,
  shouldHydrateWorkingWorkspaceContinuityFromServer,
} from "@/lib/operator/working-workspace-continuity-sync";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { USER_PREFERENCES_STALE_MS } from "@/lib/api/user-preferences-types";

/** IH-066 — hydrate pins/recents localStorage from account preferences on load. */
export function WorkingWorkspaceContinuityHydrator(): null {
  const hydratedRef = useRef(false);
  const preferencesQuery = useQuery({
    queryKey: operatorQueryKeys.userPreferences,
    queryFn: fetchUserPreferencesFromApi,
    staleTime: USER_PREFERENCES_STALE_MS,
  });

  useEffect(() => {
    if (hydratedRef.current || preferencesQuery.data === undefined) {
      return;
    }

    const continuity = preferencesQuery.data.workingWorkspaceContinuity;

    if (
      !shouldHydrateWorkingWorkspaceContinuityFromServer(
        continuity,
        preferencesQuery.data.workingWorkspaceContinuityIsExplicit,
      )
    ) {
      return;
    }

    applyWorkingWorkspaceContinuityFromServer(continuity);
    hydratedRef.current = true;
  }, [preferencesQuery.data]);

  return null;
}
