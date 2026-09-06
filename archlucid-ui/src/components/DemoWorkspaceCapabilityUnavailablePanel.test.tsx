import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import {
  BUYER_DEMO_CAPABILITY_TROUBLESHOOTING_CTA,
  BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

describe("DemoWorkspaceCapabilityUnavailablePanel", () => {
  it("renders buyer-safe title, recovery actions, and capability metadata", () => {
    render(
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Digest delivery"
        description="In a connected tenant, architects configure scheduled scheduled digests here."
      />,
    );

    expect(screen.getByTestId("demo-workspace-capability-unavailable")).toHaveAttribute(
      "data-demo-capability",
      "Digest delivery",
    );
    expect(screen.getByText(BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE)).toBeInTheDocument();
    expect(
      screen.getByText("In a connected tenant, architects configure scheduled scheduled digests here."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open reviews" })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getByRole("link", { name: BUYER_DEMO_CAPABILITY_TROUBLESHOOTING_CTA })).toHaveAttribute(
      "href",
      "/help/troubleshooting",
    );
  });
});
