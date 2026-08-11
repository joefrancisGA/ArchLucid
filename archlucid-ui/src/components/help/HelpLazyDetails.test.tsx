import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";

describe("HelpLazyDetails", () => {
  it("does not mount body content until the disclosure opens", () => {
    render(
      <HelpLazyDetails
        data-testid="lazy-details"
        bodyTestId="lazy-details-body"
        summary="Show appendix"
        mountOnHash={false}
      >
        <p>Heavy markdown body</p>
      </HelpLazyDetails>,
    );

    expect(screen.queryByTestId("lazy-details-body")).toBeNull();
    expect(screen.queryByText("Heavy markdown body")).toBeNull();

    const disclosure = screen.getByTestId("lazy-details");
    expect(disclosure).toBeInstanceOf(HTMLDetailsElement);
    disclosure.open = true;
    fireEvent(disclosure, new Event("toggle", { bubbles: false }));

    expect(screen.getByTestId("lazy-details-body")).toBeInTheDocument();
    expect(screen.getByText("Heavy markdown body")).toBeInTheDocument();
  });
});
