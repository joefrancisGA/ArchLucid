import { ExploreArchLucidWalkthroughRow } from "@/components/operator-home/ExploreArchLucidWalkthroughRow";
import { StartCtoDemoCard } from "@/components/operator-home/StartCtoDemoCard";

/** Buyer-facing Explore ArchLucid rows — walkthrough and example review only. */
export function ExploreArchLucidBuyerContent(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="explore-archlucid-buyer-content">
      <ExploreArchLucidWalkthroughRow />
      <StartCtoDemoCard />
    </div>
  );
}
