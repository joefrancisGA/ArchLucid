import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsListEmptyState } from "@/components/RunsListEmptyState";
import {
  BUYER_SEED_SAMPLE_WORKSPACE_CTA,
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  RUNS_LIST_VIEW_SAMPLE_PACKAGE_CTA,
} from "@/lib/buyer-polish-copy";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/RunDemoReviewButton", () => ({
  RunDemoReviewButton: ({ variant }: { variant?: string }) => (
    <button type="button" data-testid="run-demo-review-button" data-variant={variant ?? "primary"}>
      Run demo review
    </button>
  ),
}));

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: ({ label, variant }: { label?: string; variant?: string }) => (
    <button type="button" data-testid="seed-sample-review-button" data-variant={variant ?? "outline"}>
      {label}
    </button>
  ),
}));

describe("RunsListEmptyState", () => {
  it("renders dual first-hour paths with one primary and secondary sample actions", () => {
    render(<RunsListEmptyState />);

    expect(screen.getByTestId("runs-list-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("runs-list-empty-state").className).not.toMatch(/grid-cols-2/);
    expect(screen.getByTestId("runs-list-empty-state").className).toContain("flex-col");
    expect(screen.getByTestId("runs-list-empty-sample-path")).toBeInTheDocument();

    const startReview = screen.getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA });
    expect(startReview).toHaveAttribute("href", "/reviews/new");
    expect(startReview.className).toMatch(/bg-\[var\(--al-primary-action-bg\)\]/);

    const viewSample = screen.getByRole("link", { name: RUNS_LIST_VIEW_SAMPLE_PACKAGE_CTA });
    expect(viewSample).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(viewSample.className).toMatch(/border-neutral-300/);
    expect(viewSample.className).not.toMatch(/bg-\[var\(--al-primary-action-bg\)\]/);

    expect(screen.getByTestId("run-demo-review-button")).toHaveAttribute("data-variant", "outline");
    expect(screen.getByTestId("seed-sample-review-button")).toHaveTextContent(BUYER_SEED_SAMPLE_WORKSPACE_CTA);
    expect(screen.getByTestId("seed-sample-review-button")).toHaveAttribute("data-variant", "outline");

    expect(screen.queryByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }).className).not.toMatch(
      /underline/,
    );
  });
});
