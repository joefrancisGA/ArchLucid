import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { INLINE_GUIDANCE_LABEL_CLASS } from "@/lib/design-tokens";

describe("InlineGuidanceLabel", () => {
  it("renders semantic strong with semibold class and trailing colon", () => {
    render(<InlineGuidanceLabel label="Use this when" testId="inline-guidance-use-this-when" />);

    const label = screen.getByTestId("inline-guidance-use-this-when");

    expect(label.tagName).toBe("STRONG");
    expect(label).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(label).toHaveTextContent("Use this when:");
  });

  it("renders Optional setup with semibold class", () => {
    render(<InlineGuidanceLabel label="Optional setup:" testId="inline-guidance-optional-setup" />);

    const label = screen.getByTestId("inline-guidance-optional-setup");

    expect(label.tagName).toBe("STRONG");
    expect(label).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(label).toHaveTextContent("Optional setup:");
  });
});
