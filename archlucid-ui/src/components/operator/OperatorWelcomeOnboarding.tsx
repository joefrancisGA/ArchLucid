"use client";

import { useCallback, useEffect, useState } from "react";

import { WelcomeModal } from "@/components/ui/welcome-modal";
import { listRunsByProjectPaged } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { dispatchOnboardingTourStart } from "@/lib/onboarding-tour";
import {
  setWelcomeModalVisible,
  WELCOME_MODAL_TOUR_START_DELAY_MS,
} from "@/lib/operator/operator-onboarding-coordination";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
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

    let cancelled = false;

    void (async () => {
      try {
        const raw: unknown = await listRunsByProjectPaged(DEFAULT_PROJECT_ID, 1, 10);
        const coerced = coerceRunSummaryPaged(raw, { page: 1 });

        if (cancelled) {
          return;
        }

        if (!coerced.ok) {
          return;
        }

        if (coerced.value.totalCount !== 0) {
          return;
        }

        setOpen(true);
      } catch {
        /* No modal when the runs list cannot be loaded — avoid blocking first paint on error. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverEligible]);

  const dismiss = useCallback(() => {
    persistHasSeenWelcomeOnboarding();
    setOpen(false);
  }, []);

  const startTour = useCallback(() => {
    persistHasSeenWelcomeOnboarding();
    setOpen(false);

    window.setTimeout(() => {
      dispatchOnboardingTourStart();
    }, WELCOME_MODAL_TOUR_START_DELAY_MS);
  }, []);

  return (
    <WelcomeModal open={open} onDismiss={dismiss} onStartTour={startTour} buyerShell={isBuyerPolishedOperatorShellEnv()} />
  );
}
