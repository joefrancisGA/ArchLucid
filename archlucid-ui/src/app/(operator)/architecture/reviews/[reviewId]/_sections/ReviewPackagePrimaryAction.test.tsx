import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/CommitRunButton", () => ({
  CommitRunButton: ({
    buttonVariant,
  }: {
    buttonVariant?: "primary" | "outline";
  }) => (
    <button type="button" data-testid="commit-run-button" data-button-variant={buttonVariant ?? "primary"}>
      Finalize review
    </button>
  ),
}));

import { ReviewPackagePrimaryAction } from "./ReviewPackagePrimaryAction";

describe("ReviewPackagePrimaryAction", () => {
  it("renders a filled primary link action by default", () => {
    render(
      <ReviewPackagePrimaryAction
        action={{
          kind: "review-findings",
          label: "Review findings",
          href: "/architecture/reviews/run-1?reviewTab=findings",
        }}
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
      />,
    );

    expect(screen.getByRole("link", { name: "Review findings" })).toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );
  });

  it("demotes link and finalize actions to outline when requested", () => {
    const { rerender } = render(
      <ReviewPackagePrimaryAction
        action={{
          kind: "review-findings",
          label: "Review findings",
          href: "/architecture/reviews/run-1?reviewTab=findings",
        }}
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        demoted
      />,
    );

    expect(screen.getByRole("link", { name: "Review findings" })).toHaveClass("border-neutral-300");

    rerender(
      <ReviewPackagePrimaryAction
        action={{
          kind: "finalize-package",
          label: "Finalize review",
          href: null,
        }}
        runId="run-1"
        hasGoldenManifest={false}
        commitBlockedReason={null}
        demoted
      />,
    );

    expect(screen.getByTestId("commit-run-button")).toHaveAttribute("data-button-variant", "outline");
  });
});
