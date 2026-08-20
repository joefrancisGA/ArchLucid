"use client";

import type { JSX } from "react";
import dynamic from "next/dynamic";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";
import { cn } from "@/lib/utils";
import { OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";

const pilotCommandCenterLoadingWrapper = (loading: JSX.Element): JSX.Element => (
  <section aria-label="Overview command center" data-testid="pilot-command-center-card-loading">
    {loading}
  </section>
);

/** TB-2145 / TB-2371 — pilot command center off home First Load JS (hydrates after first paint). */
export const PilotCommandCenterCardDeferred = createDeferredComponentFromManifest(
  "operator-home-command-center",
  {
    loadingClassName: cn(OPERATOR_SURFACE_CARD_CLASS, "h-48"),
    loadingTestId: "pilot-command-center-deferred-chunk-loading",
    loadingWrapper: pilotCommandCenterLoadingWrapper,
  },
);

export const OperatorHomeSponsorRoiStripDeferred = createDeferredComponentFromManifest(
  "operator-home-sponsor-roi",
  { suppressLoading: true },
);

export const OperatorHomeBelowFoldPanelsDeferred = createDeferredComponentFromManifest(
  "operator-home-below-fold",
  { suppressLoading: true },
);

/** TB-2191 — stickiness cockpit off home First Load JS (both cards hydrate after first paint). */
export const OperatorHomeStickinessCockpitDeferred = createDeferredComponentFromManifest(
  "operator-home-stickiness",
  { suppressLoading: true },
);

export const CtoDemoSponsorLandingRedirectDeferred = dynamic(
  deferredChunkLoader(() =>
    import("@/components/cto-demo/CtoDemoSponsorLandingRedirect").then(
      (module) => module.CtoDemoSponsorLandingRedirect,
    ),
  ),
  { ssr: false, loading: () => null },
);

/** Perf wave 12 — buyer-polished home hero off sync First Load JS. */
export const BuyerPolishedHomeHeroSectionDeferred = createDeferredComponentFromManifest("operator-home-hero", {
  loadingClassName: cn(OPERATOR_SURFACE_CARD_CLASS, "h-56"),
  loadingTestId: "buyer-polished-home-hero-deferred-chunk-loading",
});

/** Perf wave 12 — JWT home access gate off sync First Load JS. */
export const OperatorHomeGateDeferred = createDeferredComponentFromManifest("operator-home-gate", {
  loadingClassName: "min-h-[12rem]",
  loadingTestId: "operator-home-gate-deferred-chunk-loading",
});
