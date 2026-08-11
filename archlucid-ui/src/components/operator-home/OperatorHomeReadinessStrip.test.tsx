import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
} from "@/lib/buyer-polish-copy";

import { OperatorHomeReadinessStrip } from "./OperatorHomeReadinessStrip";

describe("OperatorHomeReadinessStrip", () => {
  it("renders nothing when the workspace can begin", () => {
    const { container } = render(<OperatorHomeReadinessStrip canBegin blockerMessage={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing by default so unverified readiness is never announced as ready", () => {
    const { container } = render(<OperatorHomeReadinessStrip />);

    expect(container).toBeEmptyDOMElement();
  });

  it("names the blocker when a prerequisite remains", () => {
    render(<OperatorHomeReadinessStrip canBegin={false} blockerMessage={OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER} />);

    const blocker = screen.getByTestId("operator-home-readiness-blocker");

    expect(blocker).toHaveTextContent(OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE);
    expect(blocker).toHaveTextContent(OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER);
    expect(blocker).toHaveAttribute("role", "status");
  });

  it("treats a blocker message as blocking even when canBegin is true", () => {
    render(<OperatorHomeReadinessStrip canBegin blockerMessage={OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER} />);

    expect(screen.getByTestId("operator-home-readiness-blocker")).toHaveTextContent(
      OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    );
  });
});
