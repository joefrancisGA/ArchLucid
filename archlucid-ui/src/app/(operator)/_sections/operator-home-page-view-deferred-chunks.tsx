"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import { OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";

const pilotCommandCenterLoading = (
  <section aria-label="Overview command center" data-testid="pilot-command-center-card-loading">
    <div
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "h-48 animate-pulse p-4")}
      role="status"
      aria-label="Loading overview command center"
    />
  </section>
);

/** TB-2145 — pilot command center off home First Load JS (hydrates after first paint). */
export const PilotCommandCenterCardDeferred = dynamic(
  () =>
    import("@/components/usability/PilotCommandCenterCard").then((module) => module.PilotCommandCenterCard),
  { ssr: false, loading: () => pilotCommandCenterLoading },
);

export const OperatorHomeExecutiveRoiStripDeferred = dynamic(
  () =>
    import("@/components/operator-home/OperatorHomeExecutiveRoiStrip").then(
      (module) => module.OperatorHomeExecutiveRoiStrip,
    ),
  { ssr: false, loading: () => null },
);

export const OperatorHomeBelowFoldPanelsDeferred = dynamic(
  () =>
    import("@/app/(operator)/_sections/OperatorHomeBelowFoldPanels").then(
      (module) => module.OperatorHomeBelowFoldPanels,
    ),
  { ssr: false, loading: () => null },
);

export const CtoDemoExecutiveLandingRedirectDeferred = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoExecutiveLandingRedirect").then(
      (module) => module.CtoDemoExecutiveLandingRedirect,
    ),
  { ssr: false, loading: () => null },
);

const buyerPolishedHeroLoading = (
  <div
    className={cn(OPERATOR_SURFACE_CARD_CLASS, "h-56 animate-pulse p-4")}
    role="status"
    aria-label="Loading overview hero"
  />
);

/** Perf wave 12 — buyer-polished home hero off sync First Load JS. */
export const BuyerPolishedHomeHeroSectionDeferred = dynamic(
  () =>
    import("@/components/operator-home/BuyerPolishedHomeHeroSection").then(
      (module) => module.BuyerPolishedHomeHeroSection,
    ),
  { ssr: false, loading: () => buyerPolishedHeroLoading },
);

/** Perf wave 12 — JWT home access gate off sync First Load JS. */
export const OperatorHomeGateDeferred = dynamic(
  () => import("@/components/operator-home/OperatorHomeGate").then((module) => module.OperatorHomeGate),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[12rem] items-center justify-center"
        role="status"
        aria-label="Checking workspace access"
      />
    ),
  },
);
