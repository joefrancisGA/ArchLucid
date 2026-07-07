import { ExploreArchLucidWalkthroughRow } from "@/components/operator-home/ExploreArchLucidWalkthroughRow";

/** Buyer-facing Explore ArchLucid — walkthrough only; sample paths live in the hero and Explore sample section. */
export function ExploreArchLucidBuyerContent(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="explore-archlucid-buyer-content">
      <ExploreArchLucidWalkthroughRow />
    </div>
  );
}
