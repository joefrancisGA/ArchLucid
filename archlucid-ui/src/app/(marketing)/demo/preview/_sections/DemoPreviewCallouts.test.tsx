import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PREVIEW_SIGNIN_ACTION } from "@/lib/demo-preview-page-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { resolveShowcaseOperatorReviewHref } from "@/lib/showcase-operator-review-href";

import { DemoPreviewEvaluationCta, DemoPreviewSignInCallout } from "./DemoPreviewCallouts";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => "architecture-showcase-callout-001"),
}));

const reviewReturnPath = resolveShowcaseOperatorReviewHref(SHOWCASE_STATIC_DEMO_RUN_ID);
const expectedSignInHref = `/auth/signin?returnUrl=${encodeURIComponent(reviewReturnPath)}`;

describe("DemoPreviewSignInCallout", () => {
  it("includes returnUrl when given a showcase review path", () => {
    render(<DemoPreviewSignInCallout signInReturnPath={reviewReturnPath} />);

    expect(screen.getByRole("link", { name: DEMO_PREVIEW_SIGNIN_ACTION })).toHaveAttribute(
      "href",
      expectedSignInHref,
    );
  });
});

describe("DemoPreviewEvaluationCta", () => {
  it("includes returnUrl on the sign-in CTA when given a showcase review path", () => {
    render(<DemoPreviewEvaluationCta signInReturnPath={reviewReturnPath} />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", expectedSignInHref);
  });
});
