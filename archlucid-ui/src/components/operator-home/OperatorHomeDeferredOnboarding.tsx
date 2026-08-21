"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

const OperatorWelcomeOnboardingDeferred = createDeferredComponentFromManifest("operator-home-welcome-onboarding", {
  suppressLoading: true,
});

const TrialWelcomeRunDeepLinkDeferred = createDeferredComponentFromManifest("operator-home-trial-welcome-deep-link", {
  suppressLoading: true,
});

const FirstValueReachedCalloutDeferred = createDeferredComponentFromManifest("operator-home-first-value-callout", {
  suppressLoading: true,
});

/** Trial deep-link and welcome overlays — not needed for first paint of the home dashboard. */
export function OperatorHomeDeferredOnboarding() {
  return (
    <>
      <TrialWelcomeRunDeepLinkDeferred />
      <OperatorWelcomeOnboardingDeferred />
    </>
  );
}

export function OperatorHomeFirstValueCallout() {
  return <FirstValueReachedCalloutDeferred />;
}
