"use client";

import dynamic from "next/dynamic";

import { useAppShellIdleOverlaysReady } from "@/hooks/use-app-shell-idle-overlays-ready";

const CorePilotWizardLauncher = dynamic(
  () => import("@/components/CorePilotWizard").then((module) => module.CorePilotWizardLauncher),
  { ssr: false },
);

const PilotBaselineWizardLauncher = dynamic(
  () =>
    import("@/components/PilotBaselineWizardLauncher").then(
      (module) => module.PilotBaselineWizardLauncher,
    ),
  { ssr: false },
);

const CtoDemoOfflineAutoFallbackListener = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoOfflineAutoFallbackListener").then(
      (module) => module.CtoDemoOfflineAutoFallbackListener,
    ),
  { ssr: false },
);

const CtoDemoPanicModeBanner = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoPanicModeBanner").then(
      (module) => module.CtoDemoPanicModeBanner,
    ),
  { ssr: false },
);

const CtoDemoSpotlightOverlay = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoSpotlightOverlay").then(
      (module) => module.CtoDemoSpotlightOverlay,
    ),
  { ssr: false },
);

const BuyerCtoDemoTourOverlay = dynamic(
  () => import("@/components/BuyerCtoDemoTourOverlay").then((module) => module.BuyerCtoDemoTourOverlay),
  { ssr: false },
);

/** Wizard and demo overlays deferred until after first paint / idle (TB-696). Onboarding tour stays eager in `AppShellClient`. */
export function AppShellIdleOverlays() {
  const ready = useAppShellIdleOverlaysReady();

  if (!ready) {
    return null;
  }

  return (
    <>
      <CorePilotWizardLauncher />
      <PilotBaselineWizardLauncher />
      <CtoDemoOfflineAutoFallbackListener />
      <CtoDemoPanicModeBanner />
      <CtoDemoSpotlightOverlay />
      <BuyerCtoDemoTourOverlay />
    </>
  );
}
