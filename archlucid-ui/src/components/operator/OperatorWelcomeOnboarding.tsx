"use client";

import { useCallback, useEffect, useState } from "react";

import { WelcomeModal } from "@/components/ui/welcome-modal";
import { useRunsByProjectPagedQuery } from "@/hooks/use-runs-by-project-paged-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { dispatchOnboardingTourStart } from "@/lib/onboarding-tour";
import {
  setWelcomeModalVisible,
  WELCOME_MODAL_TOUR_START_DELAY_MS,
} from "@/lib/operator/operator-onboarding-coordination";
import {
  persistHasSeenWelcomeOnboarding,
  readHasSeenWelcomeOnboarding,
} from "@/lib/operator/operator-welcome-onboarding-storage";

export type OperatorWelcomeOnboardingProps = {
  /**
   * When provided from SSR (reviews list), skips a duplicate client fetch. `true` = zero authoritative runs and demo
   * fallback did not inflate the count; `false` = skip modal.
   */
  readonly serverEligible?: boolean;
};

const DEFAULT_PROJECT_ID = "default";

/**
 * First-time welcome dialog on home, reviews (`/architecture/reviews`), or sponsor `/dashboard`: shown when the welcome modal was
 * not dismissed and the default project has no runs (unless `serverEligible` is false).
 */
export function OperatorWelcomeOnboarding(props: OperatorWelcomeOnboardingProps) {
  const { serverEligible } = props;
  const [open, setOpen] = useState(false);
  const runsQuery = useRunsByProjectPagedQuery(
    { projectId: DEFAULT_PROJECT_ID, page: 1, pageSize: 10 },
    {
      enabled:
        typeof window !== "undefined" &&
        !isBuyerPolishedOperatorShellEnv() &&
        !readHasSeenWelcomeOnboarding() &&
        serverEligible === undefined,
    },
  );

  useEffect(() => {
    setWelcomeModalVisible(open);
  }, [open]);

  useEffect(() => {
    return () => {
      setWelcomeModalVisible(false);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    if (readHasSeenWelcomeOnboarding()) {
      return;
    }

    if (serverEligible === false) {
      return;
    }

    if (serverEligible === true) {
      setOpen(true);

      return;
    }

    if (runsQuery.isSuccess && (((runsQuery.data as { totalCount?: number } | undefined)?.totalCount) ?? 0) === 0) {
      setOpen(true);
    }
  }, [runsQuery.data, runsQuery.isSuccess, serverEligible]);

  const dismiss = useCallback(() => {
    persistHasSeenWelcomeOnboarding();
    setOpen(false);
  }, []);

  const startTour = useCallback(() => {
    dismiss();
    window.setTimeout(() => {
      dispatchOnboardingTourStart();
    }, WELCOME_MODAL_TOUR_START_DELAY_MS);
  }, [dismiss]);

  return (
    <WelcomeModal
      open={open}
      onDismiss={dismiss}
      onStartTour={startTour}
      buyerShell={isBuyerPolishedOperatorShellEnv()}
    />
  );
}
