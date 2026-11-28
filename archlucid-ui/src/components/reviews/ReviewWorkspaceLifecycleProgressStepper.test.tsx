// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReviewWorkspaceLifecycleProgressStepper } from "@/components/reviews/ReviewWorkspaceLifecycleProgressStepper";

afterEach(cleanup);

describe("ReviewWorkspaceLifecycleProgressStepper", () => {
  it.each([
    ["create-home", "Open review"],
    ["in-review", "Evidence & findings"],
    ["finalized", "Share & compare"],
  ] as const)("exposes exactly one current step for %s", (lifecycle, label) => {
    render(<ReviewWorkspaceLifecycleProgressStepper lifecycle={lifecycle} />);

    const list = within(screen.getByRole("region", { name: "Review lifecycle progress" })).getByRole("list");
    const steps = within(list).getAllByRole("listitem");

    expect(steps.filter((step) => step.getAttribute("aria-current") === "step"))
      .toEqual([within(list).getByText(label)]);
  });

  it("does not render a progress list after sealing", () => {
    render(<ReviewWorkspaceLifecycleProgressStepper lifecycle="finalized" reviewIsSealed />);

    expect(screen.queryByRole("region", { name: "Review lifecycle progress" })).toBeNull();
  });
});
