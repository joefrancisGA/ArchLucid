"use client";

import { useEffect, useState } from "react";

import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { CorePilotBuyerStepHint } from "@/components/CorePilotBuyerStepHint";
import { OperatorCoArchitectHomeStrip } from "@/components/OperatorCoArchitectHomeStrip";
import { SampleFirstReviewPackageCard } from "@/components/SampleFirstReviewPackageCard";
import { SamplePackageShortcutsCard } from "@/components/operator-home/SamplePackageShortcutsCard";
import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { StartCtoDemoCard } from "@/components/operator-home/StartCtoDemoCard";
import { FirstValueReachedCallout } from "@/components/FirstValueReachedCallout";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { readBuyerCtoDemoTourActive, ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT } from "@/lib/buyer-cto-demo-tour";

/** Buyer-polished home hero — hides secondary onboarding panels while the CTO demo tour is active. */
export function BuyerPolishedHomeHeroSection(): React.JSX.Element {
  const [tourActive, setTourActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTourActive(readBuyerCtoDemoTourActive());

    function onTourStart(): void {
      setTourActive(true);
    }

    window.addEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, onTourStart);

    return () => {
      window.removeEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, onTourStart);
    };
  }, []);

  const hideSecondaryPanels = mounted && tourActive;

  return (
    <section
      aria-label="Your first architecture review"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start"
      data-testid="operator-home-hero-section"
    >
      <div className="min-w-0 space-y-4">
        <BuyerCtoDemoReadinessPanel />
        <StartCtoDemoCard />
        {hideSecondaryPanels ? null : (
          <div className="space-y-4" data-testid="buyer-home-secondary-panels">
            <FirstValueReachedCallout />
            <WelcomeBanner />
            <CorePilotBuyerStepHint />
            <BeforeAfterDeltaPanel />
            <OperatorCoArchitectHomeStrip buyerPolishedShell />
            <SampleFirstReviewPackageCard buyerPolishedShell={true} />
          </div>
        )}
      </div>
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start" aria-label="Example review package shortcuts">
        <SamplePackageShortcutsCard />
      </aside>
    </section>
  );
}
