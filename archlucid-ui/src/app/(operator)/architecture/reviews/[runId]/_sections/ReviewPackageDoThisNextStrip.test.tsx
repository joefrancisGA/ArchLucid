import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewPackageDoThisNextStrip } from "./ReviewPackageDoThisNextStrip";

vi.mock("@/components/CommitRunButton", () => ({
  CommitRunButton: () => <button type="button">Finalize review</button>,
}));

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

  it("renders outline evidence CTA and secondary sponsor link when demoted", () => {
    render(
      <ReviewPackageDoThisNextStrip
        runId="run-1"
        hasGoldenManifest
        commitBlockedReason={null}
        next={{
          kind: "send-to-sponsor",
          sentence:
            "This package is finalized, but none of its 4 open findings have linked evidence — review evidence coverage before sharing with a sponsor.",
          actionLabel: "Review evidence coverage",
          href: "/architecture/reviews/run-1?reviewTab=evidence",
          buttonVariant: "outline",
          secondaryAction: {
            label: "Send to sponsor",
            href: "/architecture/reviews/run-1?reviewTab=review-package#sponsor-handoff",
          },
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Review evidence coverage" })).toBeInTheDocument();
    expect(screen.getByTestId("review-package-do-this-next-secondary-action")).toHaveTextContent("Send to sponsor");
  });
});
