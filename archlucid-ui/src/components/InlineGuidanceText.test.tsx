import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { INLINE_GUIDANCE_LABEL_CLASS } from "@/lib/design-tokens";

describe("InlineGuidanceText", () => {
  it("emphasizes only the leading guidance label", () => {
    render(
      <InlineGuidanceText text="Optional setup: Finish workspace setup, reviewer access, and optional cloud connections." />,
    );

    const label = screen.getByText("Optional setup:");

    expect(label.tagName).toBe("STRONG");
    expect(label).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(
      screen.getByText(/Finish workspace setup, reviewer access, and optional cloud connections\./),
    ).toBeInTheDocument();
  });

  it("emphasizes the quick start scan label", () => {
    render(
      <InlineGuidanceText text="Quick start: review title, attach evidence, and start a review in one screen." />,
    );

    expect(screen.getByText("Quick start:").tagName).toBe("STRONG");
    expect(screen.getByText(/review title, attach evidence, and start a review in one screen\./)).toBeInTheDocument();
  });

  it("capitalizes label-style guidance bodies after the colon", () => {
    render(<InlineGuidanceText text="Optional: use Routing to notify email or webhooks when a rule fires." />);

    expect(screen.getByText(/Use Routing to notify email/i)).toBeInTheDocument();
  });

  it("emphasizes the required before review scan label", () => {
    render(
      <InlineGuidanceText text="Required before review: complete the system name, architecture overview, business outcome, and at least one confirmed person or system in this draft." />,
    );

    expect(screen.getByText("Required before review:").tagName).toBe("STRONG");
    expect(
      screen.getByText(/Complete the system name, architecture overview, business outcome/i),
    ).toBeInTheDocument();
  });

  it("renders plain copy when no guidance label prefix is present", () => {
    render(<InlineGuidanceText text="Finish architecture reviews first." />);

    expect(screen.getByText("Finish architecture reviews first.")).toBeInTheDocument();
    expect(screen.queryByRole("strong")).not.toBeInTheDocument();
  });
});
