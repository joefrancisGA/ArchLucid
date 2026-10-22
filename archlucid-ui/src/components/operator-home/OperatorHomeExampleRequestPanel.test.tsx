import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { OperatorHomeExampleRequestPanel } from "@/components/operator-home/OperatorHomeExampleRequestPanel";
import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_START_CTA,
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator/operator-home-example-request";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const committedReviewMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 3,
      hasCommittedArchitectureReview: committedReviewMock.value,
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

describe("OperatorHomeExampleRequestPanel (TB-348)", () => {
  it("renders the example brief and CTAs for first-run tenants", () => {
    committedReviewMock.value = false;

    render(<OperatorHomeExampleRequestPanel />);

    expect(screen.getByTestId("operator-home-example-request-panel")).toBeInTheDocument();
    expect(screen.getByText("Sample request")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_EXAMPLE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-example-request-use")).toHaveAttribute(
      "href",
      reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID),
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_EXAMPLE_START_CTA })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-example-request-completed")).toHaveAttribute(
      "href",
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    );
  });

  it("hides once the tenant has a committed architecture review", () => {
    committedReviewMock.value = true;

    render(<OperatorHomeExampleRequestPanel />);

    expect(screen.queryByTestId("operator-home-example-request-panel")).toBeNull();
  });
});