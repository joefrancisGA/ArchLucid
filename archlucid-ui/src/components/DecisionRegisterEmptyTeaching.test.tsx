import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterEmptyTeaching } from "@/components/DecisionRegisterEmptyTeaching";
import {
  DECISION_REGISTER_EMPTY_TEACHING_BODY,
  DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION,
  DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
  DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION,
  DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION,
  DECISION_REGISTER_EMPTY_TEACHING_TITLE,
} from "@/lib/decision-register-empty-teaching";

describe("DecisionRegisterEmptyTeaching (TB-2263)", () => {
  it("renders title, body, honesty, and next-step links", () => {
    render(<DecisionRegisterEmptyTeaching />);

    expect(screen.getByTestId("decision-register-empty-teaching")).toBeInTheDocument();
    expect(screen.getByText(DECISION_REGISTER_EMPTY_TEACHING_TITLE)).toBeInTheDocument();
    expect(screen.getByText(DECISION_REGISTER_EMPTY_TEACHING_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-empty-teaching-honesty")).toHaveTextContent(
      DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
    );

    const findings = screen.getByTestId("decision-register-empty-teaching-action-triage-findings");
    expect(findings).toHaveTextContent(DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION.label);
    expect(findings).toHaveAttribute("href", DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION.href);

    const startReview = screen.getByTestId("decision-register-empty-teaching-action-start-review");
    expect(startReview).toHaveTextContent(DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION.label);
    expect(startReview).toHaveAttribute(
      "href",
      DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION.href,
    );

    const openReviews = screen.getByTestId("decision-register-empty-teaching-action-open-reviews");
    expect(openReviews).toHaveTextContent(DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION.label);
    expect(openReviews).toHaveAttribute(
      "href",
      DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION.href,
    );
  });
});
