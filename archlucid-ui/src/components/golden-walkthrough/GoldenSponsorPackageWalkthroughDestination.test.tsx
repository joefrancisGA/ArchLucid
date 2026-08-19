import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

import { GoldenSponsorPackageWalkthroughDestination } from "./GoldenSponsorPackageWalkthroughDestination";

describe("GoldenSponsorPackageWalkthroughDestination", () => {
  beforeEach(() => {
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders the destination callout and scrolls to sponsor handoff when walkthrough is active", () => {
    const scrollIntoView = vi.fn();

    useSearchParams.mockReturnValue(new URLSearchParams("walkthrough=sponsor-package"));

    const target = document.createElement("div");

    target.id = "sponsor-handoff";
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(<GoldenSponsorPackageWalkthroughDestination showSampleWalkthroughDestination />);

    expect(screen.getByTestId("golden-sponsor-package-walkthrough-destination")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalled();

    target.remove();
  });

  it("renders nothing without walkthrough intent", () => {
    render(<GoldenSponsorPackageWalkthroughDestination showSampleWalkthroughDestination />);

    expect(screen.queryByTestId("golden-sponsor-package-walkthrough-destination")).toBeNull();
  });

  it("renders nothing on live reviews even when walkthrough query is present", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("walkthrough=sponsor-package"));

    render(
      <GoldenSponsorPackageWalkthroughDestination showSampleWalkthroughDestination={false} />,
    );

    expect(screen.queryByTestId("golden-sponsor-package-walkthrough-destination")).toBeNull();
  });
});
