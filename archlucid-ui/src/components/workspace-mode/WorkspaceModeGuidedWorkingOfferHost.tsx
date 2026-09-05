"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { WorkspaceModeGraduationOffer } from "@/components/workspace-mode/WorkspaceModeGraduationOffer";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  fetchUserPreferencesFromApi,
  USER_PREFERENCES_STALE_MS,
} from "@/lib/api/user-preferences";
import { workspaceModeGraduationOfferPanelsHrefFromSearch } from "@/lib/operator/workspace-mode-graduation-offer-panels-url";
import { isGuidedWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Opt-in Working invitation for Guided seats after first commit (FD-10). Never auto-switches. */
export function WorkspaceModeGuidedWorkingOfferHost(): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { mode, setAndPersist } = useWorkspaceMode();
  const evalChrome = useProductionEvalChrome();
  const commitQuery = useCorePilotCommitContextQuery();
  const preferencesQuery = useQuery({
    queryKey: operatorQueryKeys.userPreferences,
    queryFn: fetchUserPreferencesFromApi,
    staleTime: USER_PREFERENCES_STALE_MS,
  });
  const [dismissedLocally, setDismissedLocally] = useState(false);

  const syncGraduationOfferOpenToUrl = useCallback(
    (offerOpen: boolean) => {
      router.replace(
        workspaceModeGraduationOfferPanelsHrefFromSearch(searchParams.toString(), offerOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setDismissedLocallyWithUrl = useCallback(
    (value: SetStateAction<boolean>) => {
      setDismissedLocally((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (next) {
          syncGraduationOfferOpenToUrl(false);
        }

        return next;
      });
    },
    [syncGraduationOfferOpenToUrl],
  );

  const hasCommittedPackage = commitQuery.data?.hasCommittedManifest === true;
  const graduationOffer = preferencesQuery.data?.workspaceModeGraduationOffer ?? "pending";
  const offerEligible =
    !dismissedLocally
    && evalChrome
    && isGuidedWorkspaceMode(mode)
    && hasCommittedPackage
    && graduationOffer !== "dismissed"
    && graduationOffer !== "remind-next";

  useEffect(() => {
    syncGraduationOfferOpenToUrl(offerEligible);
  }, [offerEligible, syncGraduationOfferOpenToUrl]);

  if (!offerEligible) {
    return null;
  }

  return (
    <div className="mb-4" data-testid="workspace-mode-guided-working-offer-host">
      <WorkspaceModeGraduationOffer
        onSwitchToWorking={() => {
          setAndPersist("working");
          setDismissedLocallyWithUrl(true);
        }}
        onDismiss={() => {
          setDismissedLocallyWithUrl(true);
        }}
      />
    </div>
  );
}
