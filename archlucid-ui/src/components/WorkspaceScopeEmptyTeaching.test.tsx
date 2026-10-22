import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";

describe("WorkspaceScopeEmptyTeaching", () => {
  it("renders title, body, and CTA with the stable test id", () => {
    render(
      <WorkspaceScopeEmptyTeaching
        title="No reviews in Payments"
        body="Switch workspace/project to see other work."
        ctaLabel="Switch workspace/project"
      />,
    );

    expect(screen.getByTestId("workspace-scope-empty-teaching")).toBeInTheDocument();
    expect(screen.getByText("No reviews in Payments")).toBeInTheDocument();
    expect(screen.getByText("Switch workspace/project to see other work.")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-scope-empty-teaching-cta")).toHaveTextContent(
      "Switch workspace/project",
    );
  });

  it("invokes onSwitchScope when the CTA is clicked", () => {
    const onSwitchScope = vi.fn();

    render(
      <WorkspaceScopeEmptyTeaching
        title="No reviews in Payments"
        body="Switch workspace/project to see other work."
        ctaLabel="Switch workspace/project"
        onSwitchScope={onSwitchScope}
      />,
    );

    fireEvent.click(screen.getByTestId("workspace-scope-empty-teaching-cta"));

    expect(onSwitchScope).toHaveBeenCalledTimes(1);
  });
});
