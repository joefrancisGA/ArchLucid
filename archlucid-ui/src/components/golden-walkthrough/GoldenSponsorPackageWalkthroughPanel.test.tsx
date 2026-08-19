import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GoldenSponsorPackageWalkthroughPanel } from "./GoldenSponsorPackageWalkthroughPanel";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS,
  buildGoldenSponsorPackageWalkthroughHref,
} from "@/lib/golden-sponsor-package-walkthrough";

describe("GoldenSponsorPackageWalkthroughPanel", () => {
  it("renders the checklist and primary CTA to the sponsor export destination", () => {
    render(<GoldenSponsorPackageWalkthroughPanel />);

    expect(screen.getByTestId("golden-sponsor-package-walkthrough")).toBeInTheDocument();
    expect(screen.getByTestId("golden-sponsor-package-walkthrough-steps")).toBeInTheDocument();
    expect(screen.getAllByTestId(/golden-sponsor-package-walkthrough-step-/)).toHaveLength(
      GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS.length,
    );
    expect(screen.getByText("Illustrative sample")).toBeInTheDocument();

    const primary = screen.getByTestId("golden-sponsor-package-walkthrough-primary");

    expect(primary).toHaveTextContent(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA);
    expect(primary).toHaveAttribute("href", buildGoldenSponsorPackageWalkthroughHref());
    expect(primary.className).toContain("border-neutral-300");
    expect(primary.className).not.toContain("bg-[var(--al-primary-action-bg)]");
  });
});
