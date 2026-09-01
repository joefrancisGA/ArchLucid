import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FinalizeReadinessStrip } from "@/components/reviews/FinalizeReadinessStrip";
import { DO_THIS_NEXT_SECTION_LABEL } from "@/lib/usability/do-this-next-reference-copy";

describe("FinalizeReadinessStrip", () => {
  it("bolds Do this next in failed-assessment finalize block copy", () => {
    render(
      <FinalizeReadinessStrip commitBlockedReason="Assessment failed — follow the recovery steps in Do this next below, then re-run the review before finalizing." />,
    );

    const emphasis = screen.getByText(DO_THIS_NEXT_SECTION_LABEL);

    expect(emphasis.tagName).toBe("STRONG");
    expect(screen.getByText(/Finalize is blocked until you resolve the following/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          "Assessment failed — follow the recovery steps in Do this next below, then re-run the review before finalizing.",
      ),
    ).toBeInTheDocument();
  });
});
