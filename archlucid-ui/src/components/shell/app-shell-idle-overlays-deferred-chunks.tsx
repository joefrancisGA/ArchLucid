"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const CorePilotWizardLauncherDeferred = createDeferredComponentFromManifest(
  "app-shell-idle-core-pilot-wizard-launcher",
  { suppressLoading: true },
);

export const PilotBaselineWizardLauncherDeferred = createDeferredComponentFromManifest(
  "app-shell-idle-pilot-baseline-wizard-launcher",
  { suppressLoading: true },
);

export const CtoDemoOfflineAutoFallbackListenerDeferred = createDeferredComponentFromManifest(
  "app-shell-idle-cto-demo-offline-auto-fallback-listener",
  { suppressLoading: true },
);

export const CtoDemoPanicModeBannerDeferred = createDeferredComponentFromManifest(
  "app-shell-idle-cto-demo-panic-mode-banner",
  { suppressLoading: true },
);

export const CtoDemoSpotlightOverlayDeferred = createDeferredComponentFromManifest(
  "app-shell-idle-cto-demo-spotlight-overlay",
  { suppressLoading: true },
);

export const BuyerCtoDemoTourOverlayDeferred = createDeferredComponentFromManifest(
  "app-shell-idle-buyer-cto-demo-tour-overlay",
  { suppressLoading: true },
);
