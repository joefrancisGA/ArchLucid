import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE,
  OperatorRelatedSurfacesDisclosure,
} from "@/components/operator/OperatorRelatedSurfacesDisclosure";

describe("OperatorRelatedSurfacesDisclosure", () => {
  it("renders collapsed disclosure with default title and children", () => {
    render(
      <OperatorRelatedSurfacesDisclosure testId="related-surfaces-disclosure">
        <div data-testid="related-surface-child">Vocabulary rail</div>
      </OperatorRelatedSurfacesDisclosure>,
    );

    const disclosure = screen.getByTestId("related-surfaces-disclosure");
    expect(disclosure.tagName).toBe("DETAILS");
    expect(screen.getByText(OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("related-surface-child")).toBeInTheDocument();
  });

  it("supports custom disclosure title", () => {
    render(
      <OperatorRelatedSurfacesDisclosure testId="custom-related-surfaces-disclosure" title="Related queues">
        <div>Child</div>
      </OperatorRelatedSurfacesDisclosure>,
    );

    expect(screen.getByText("Related queues")).toBeInTheDocument();
    expect(screen.queryByText(OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE)).not.toBeInTheDocument();
  });
});
