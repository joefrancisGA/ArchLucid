import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GettingStartedSteps } from "@/components/GettingStartedSteps";

describe("GettingStartedSteps", () => {
  it("emphasizes optional guidance labels inside step copy", () => {
    render(
      <GettingStartedSteps
        heading="How alerts land here"
        steps={["Optional: use Routing to notify email or webhooks when a rule fires."]}
      />,
    );

    const label = screen.getByText("Optional:");

    expect(label.tagName).toBe("STRONG");
    expect(screen.getByText(/use Routing to notify email/i)).toBeInTheDocument();
  });
});
