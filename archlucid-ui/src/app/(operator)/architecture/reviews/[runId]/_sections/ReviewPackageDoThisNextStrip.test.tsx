import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewPackageDoThisNextStrip } from "./ReviewPackageDoThisNextStrip";

describe("ReviewPackageDoThisNextStrip", () => {
  it("renders sentence and link CTA", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        next={{
          kind: "add-evidence",
          sentence: "Evidence is still thin — add architecture evidence before expecting full findings.",
          actionLabel: "Add evidence",
          href: "/architecture/reviews/run-1?reviewTab=evidence",
        }}
      />,
    );

    expect(screen.getByTestId("review-package-do-this-next-strip")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-do-this-next-sentence")).toHaveTextContent("Evidence is still thin");
    expect(screen.getByRole("link", { name: "Add evidence" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=evidence",
    );
  });
});
