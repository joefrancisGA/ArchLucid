import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";

/** Buyer-polished home hero — single compact launchpad card above the fold. */
export function BuyerPolishedHomeHeroSection(): React.JSX.Element {
  return (
    <section
      aria-label="Your first architecture review"
      data-testid="operator-home-hero-section"
    >
      <PilotCommandCenterCard />
    </section>
  );
}
