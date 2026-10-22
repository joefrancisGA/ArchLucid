"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { WelcomeModal } from "@/components/ui/welcome-modal";
import { useRunsByProjectPagedQuery } from "@/hooks/use-runs-by-project-paged-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { replaceIfHrefChanged } from "@/lib/navigation/replace-if-href-changed";
import { dispatchOnboardingTourStart } from "@/lib/onboarding-tour";
import {
  setWelcomeModalVisible,
  WELCOME_MODAL_TOUR_START_DELAY_MS,
} from "@/lib/operator/operator-onboarding-coordination";
import {
  persistHasSeenWelcomeOnboarding,
  readHasSeenWelcomeOnboarding,
} from "@/lib/operator/operator-welcome-onboarding-storage";
import {
  operatorWelcomeOnboardingHrefFromSearch,
  operatorWelcomeOnboardingUrlAlreadyMatches,
  parseOperatorWelcomeOpenFromSearch,
} from "@/lib/operator/operator-welcome-onboarding-url";

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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const welcomeOpenParam = searchParams.get("welcomeOpen");
  const [open, setOpenState] = useState(() => parseOperatorWelcomeOpenFromSearch(welcomeOpenParam));

  const syncWelcomeOpenToUrl = useCallback(
    (welcomeOpen: boolean) => {
      const currentSearch = searchParams.toString();

      if (operatorWelcomeOnboardingUrlAlreadyMatches(currentSearch, welcomeOpen)) {
        return;
      }

      replaceIfHrefChanged(
        router,
        operatorWelcomeOnboardingHrefFromSearch(currentSearch, welcomeOpen, pathname),
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (next !== current) {
          syncWelcomeOpenToUrl(next);
        }

        return next;
      });
    },
    [syncWelcomeOpenToUrl],
  );

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

    if (serverEligible === true || parseOperatorWelcomeOpenFromSearch(welcomeOpenParam)) {
      setOpen(true);

      return;
    }

    if (runsQuery.isSuccess && (((runsQuery.data as { totalCount?: number } | undefined)?.totalCount) ?? 0) === 0) {
      setOpen(true);
    }
  }, [runsQuery.data, runsQuery.isSuccess, serverEligible, setOpen, welcomeOpenParam]);

  const dismiss = useCallback(() => {
    persistHasSeenWelcomeOnboarding();
    setOpen(false);
  }, [setOpen]);

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
