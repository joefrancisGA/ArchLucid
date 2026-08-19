"use client";

import dynamic from "next/dynamic";

const OperatorWelcomeOnboarding = dynamic(
  () => import("@/components/operator/OperatorWelcomeOnboarding").then((module) => module.OperatorWelcomeOnboarding),
  { loading: () => null, ssr: false },
);

const TrialWelcomeRunDeepLink = dynamic(
  () => import("@/components/trial/TrialWelcomeRunDeepLink").then((module) => module.TrialWelcomeRunDeepLink),
  { loading: () => null, ssr: false },
);

const FirstValueReachedCallout = dynamic(
  () => import("@/components/FirstValueReachedCallout").then((module) => module.FirstValueReachedCallout),
  { loading: () => null, ssr: false },
);

/** Trial deep-link and welcome overlays — not needed for first paint of the home dashboard. */
export function OperatorHomeDeferredOnboarding() {
  return (
    <>
      <TrialWelcomeRunDeepLink />
      <OperatorWelcomeOnboarding />
    </>
  );
}

export function OperatorHomeFirstValueCallout() {
  return <FirstValueReachedCallout />;
}
