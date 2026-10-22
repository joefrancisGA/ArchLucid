import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  DO_THIS_NEXT_SECTION_LABEL,
  renderDoThisNextReferenceCopy,
} from "@/lib/usability/do-this-next-reference-copy";

describe("renderDoThisNextReferenceCopy", () => {
  it("returns plain text when the section label is absent", () => {
    expect(renderDoThisNextReferenceCopy("Re-run the review before finalizing.")).toBe(
      "Re-run the review before finalizing.",
    );
  });

  it("bolds the Do this next section label in cross-reference copy", () => {
    render(
      <p>{renderDoThisNextReferenceCopy("Follow the recovery steps in Do this next below.")}</p>,
    );

    const emphasis = screen.getByText(DO_THIS_NEXT_SECTION_LABEL);

    expect(emphasis.tagName).toBe("STRONG");
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "Follow the recovery steps in Do this next below.",
      ),
    ).toBeInTheDocument();
  });
});
