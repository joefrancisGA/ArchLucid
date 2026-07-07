import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";

/** Buyer-polished home hero — single compact launchpad card above the fold. */
export function BuyerPolishedHomeHeroSection(): React.JSX.Element {
  return (
    <section
      aria-label="Overview command center"
      data-testid="operator-home-hero-section"
    >
      <PilotCommandCenterCard />
    </section>
  );
}
