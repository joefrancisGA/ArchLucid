"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { FirstSessionPurposeChooser } from "@/components/auth/FirstSessionPurposeChooser";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  fetchUserPreferencesFromApi,
  setUserFirstSessionPurpose,
  setUserWorkingCareerRehearsalDoor,
  setUserWorkspaceMode,
  USER_PREFERENCES_STALE_MS,
} from "@/lib/api/user-preferences";
import { shouldGrandfatherFirstSessionPurposeAsLive } from "@/lib/auth/first-session-purpose-grandfather";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { visitSampleWorkspaceScope } from "@/lib/operator/operator-scope-actions";
import { bootstrapDedicatedWorkspaceScope } from "@/lib/operator/operator-scope-bootstrap";
import { isSampleWorkspaceVisitActive } from "@/lib/operator/operator-sample-workspace-visit";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

function isAuthBootstrapPath(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}

/** Once-per-user Training vs live-workspace chooser (ADR 0102). */
export function FirstSessionPurposeChooserHost(): ReactElement | null {
  const pathname = usePathname() ?? "";
  const { setAndPersist } = useWorkspaceMode();
  const preferencesQuery = useQuery({
    queryKey: operatorQueryKeys.userPreferences,
    queryFn: fetchUserPreferencesFromApi,
    staleTime: USER_PREFERENCES_STALE_MS,
    enabled: isLikelySignedIn(),
  });
  const [chooserOpen, setChooserOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const grandfatherStarted = useRef(false);
  const seatBootstrapStarted = useRef(false);

  const preferences = preferencesQuery.data;

  const applyLiveSeat = useCallback(async () => {
    setPending(true);

    try {
      await setUserFirstSessionPurpose("live");
      await setUserWorkspaceMode("working");
      await setUserWorkingCareerRehearsalDoor("career");
      await bootstrapDedicatedWorkspaceScope();
      setChooserOpen(false);
    } finally {
      setPending(false);
    }
  }, []);

  const applyTrainingSeat = useCallback(async () => {
    setPending(true);

    try {
      await setUserFirstSessionPurpose("training");
      setAndPersist("guided");
      visitSampleWorkspaceScope();
      setChooserOpen(false);
    } finally {
      setPending(false);
    }
  }, [setAndPersist]);

  useEffect(() => {
    if (!isLikelySignedIn() || isAuthBootstrapPath(pathname) || isStaticDemoPayloadFallbackEnabled()) {
      return;
    }

    if (preferences === undefined) {
      return;
    }

    if (preferences.firstSessionPurposeIsExplicit) {
      if (seatBootstrapStarted.current) {
        return;
      }

      seatBootstrapStarted.current = true;

      if (preferences.firstSessionPurpose === "training") {
        if (!isSampleWorkspaceVisitActive()) {
          setAndPersist("guided");
          visitSampleWorkspaceScope();
        }

        return;
      }

      void bootstrapDedicatedWorkspaceScope();

      return;
    }

    if (!grandfatherStarted.current && shouldGrandfatherFirstSessionPurposeAsLive(preferences)) {
      grandfatherStarted.current = true;
      void applyLiveSeat();

      return;
    }

    setChooserOpen(true);
  }, [applyLiveSeat, pathname, preferences, setAndPersist]);

  if (!chooserOpen) {
    return null;
  }

  return (
    <FirstSessionPurposeChooser
      open={chooserOpen}
      pending={pending}
      onChooseLive={() => {
        void applyLiveSeat();
      }}
      onChooseTraining={() => {
        void applyTrainingSeat();
      }}
    />
  );
}
