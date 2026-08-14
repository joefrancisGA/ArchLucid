"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useDeepLinkHashScroll } from "@/hooks/use-deep-link-hash-scroll";
import {
  ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY,
  ONBOARDING_OPTIONAL_SETUP_DISMISS_DETAIL,
  ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION,
  FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_LEAD,
  FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ONBOARDING_OPTIONAL_SETUP_DELEGATION_HEADING_ID,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
  isOnboardingOptionalSetupDeepLinkHash,
} from "@/lib/first-review-guide-route";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";

import {
  OptionalWorkspaceSetupDismissButton,
  OptionalWorkspaceSetupList,
} from "./OptionalWorkspaceSetupList";

const ONBOARDING_OPTIONAL_SETUP_STORAGE_KEY = "archlucid_onboarding_disclosure_optional_setup_v1";
const ONBOARDING_OPTIONAL_SETUP_DISMISS_KEY = "archlucid.finishSetupWizard.completed.v1";

function readOptionalSetupDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ONBOARDING_OPTIONAL_SETUP_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function readOptionalSetupDeepLinkActive(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isOnboardingOptionalSetupDeepLinkHash(window.location.hash);
}

/** Collapsed-by-default optional workspace setup — secondary to the first-review walkthrough. */
export function OnboardingOptionalSetupSection() {
  const { phase, context } = useFinishSetupReadinessContext();
  const [dismissed, setDismissed] = useState(readOptionalSetupDismissed);
  const [deepLinkActive, setDeepLinkActive] = useState(readOptionalSetupDeepLinkActive);

  useEffect(() => {
    const syncDeepLink = () => {
      setDeepLinkActive(readOptionalSetupDeepLinkActive());
    };

    window.addEventListener("hashchange", syncDeepLink);

    return () => {
      window.removeEventListener("hashchange", syncDeepLink);
    };
  }, []);

  useDeepLinkHashScroll(ONBOARDING_OPTIONAL_SETUP_HEADING_ID, isOnboardingOptionalSetupDeepLinkHash);

  useEffect(() => {
    if (!deepLinkActive) {
      return;
    }

    if (!isOnboardingOptionalSetupDeepLinkHash(window.location.hash)) {
      return;
    }

    scheduleScrollDeepLinkTargetIntoView(ONBOARDING_OPTIONAL_SETUP_HEADING_ID);
  }, [deepLinkActive, phase, context]);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_OPTIONAL_SETUP_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }

    setDismissed(true);
  }, []);

  const hideForDismiss = dismissed && !deepLinkActive;

  if (hideForDismiss) {
    return null;
  }

  if (phase === "loading") {
    if (!deepLinkActive) {
      return null;
    }

    return (
      <section
        aria-labelledby={ONBOARDING_OPTIONAL_SETUP_HEADING_ID}
        aria-busy="true"
        className="scroll-mt-24 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
        data-testid="onboarding-optional-setup-deep-link-loading"
      >
        <h2 id={ONBOARDING_OPTIONAL_SETUP_HEADING_ID} className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE}
        </h2>
        <p className={cn("m-0 mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>Loading workspace setup…</p>
      </section>
    );
  }

  if (context !== null && !context.principalAdmin) {
    return (
      <section
        id={ONBOARDING_OPTIONAL_SETUP_HEADING_ID}
        aria-labelledby={ONBOARDING_OPTIONAL_SETUP_DELEGATION_HEADING_ID}
        className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
        data-testid="onboarding-optional-setup-delegation"
      >
        <h2
          id={ONBOARDING_OPTIONAL_SETUP_DELEGATION_HEADING_ID}
          className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE}
        </h2>
        <p className={cn("m-0 mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
          {ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION}
        </p>
      </section>
    );
  }

  return (
    <OperatorHomeDisclosureSection
      title={FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE}
      titleId={ONBOARDING_OPTIONAL_SETUP_HEADING_ID}
      sectionTestId="onboarding-optional-setup"
      storageKey={ONBOARDING_OPTIONAL_SETUP_STORAGE_KEY}
      defaultExpanded={false}
      autoExpandOnHashMatch
      collapsedSummary={ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY}
    >
      <div className="space-y-4">
        <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_LEAD}</p>
        <OptionalWorkspaceSetupList />
        <div className="space-y-1">
          <OptionalWorkspaceSetupDismissButton onDismiss={onDismiss} />
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ONBOARDING_OPTIONAL_SETUP_DISMISS_DETAIL}</p>
        </div>
      </div>
    </OperatorHomeDisclosureSection>
  );
}
