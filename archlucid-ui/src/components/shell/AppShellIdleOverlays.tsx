"use client";

import { useAppShellIdleOverlaysReady } from "@/hooks/use-app-shell-idle-overlays-ready";

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

  if (!ready) {
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
