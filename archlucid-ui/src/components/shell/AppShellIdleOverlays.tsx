"use client";

import { useAppShellIdleOverlaysReady } from "@/hooks/use-app-shell-idle-overlays-ready";
import { useReviewPresenterChromeActive } from "@/hooks/use-review-presenter-chrome-active";

import {
  BuyerCtoDemoTourOverlayDeferred,
  CorePilotWizardLauncherDeferred,
  CtoDemoOfflineAutoFallbackListenerDeferred,
  CtoDemoPanicModeBannerDeferred,
  CtoDemoSpotlightOverlayDeferred,
  PilotBaselineWizardLauncherDeferred,
} from "./app-shell-idle-overlays-deferred-chunks";

/** Wizard and demo overlays deferred until after first paint / idle (TB-696). Onboarding tour stays eager in `AppShellClient`. */
export function AppShellIdleOverlays() {
  const ready = useAppShellIdleOverlaysReady();
  const presenterQuiet = useReviewPresenterChromeActive();

  if (!ready || presenterQuiet) {
    return null;
  }

  return (
    <>
      <CorePilotWizardLauncherDeferred />
      <PilotBaselineWizardLauncherDeferred />
      <CtoDemoOfflineAutoFallbackListenerDeferred />
      <CtoDemoPanicModeBannerDeferred />
      <CtoDemoSpotlightOverlayDeferred />
      <BuyerCtoDemoTourOverlayDeferred />
    </>
  );
}
