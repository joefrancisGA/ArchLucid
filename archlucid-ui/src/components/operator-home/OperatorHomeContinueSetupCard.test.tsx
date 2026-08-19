import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

import { OperatorHomeContinueSetupCard } from "./OperatorHomeContinueSetupCard";

describe("OperatorHomeContinueSetupCard", () => {
  it("renders nothing when the workspace can begin", () => {
    const { container } = render(<OperatorHomeContinueSetupCard canBegin blockerMessage={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing by default so unverified readiness is never announced as ready", () => {
    const { container } = render(<OperatorHomeContinueSetupCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows an explicit blocker instead of fractional readiness counts", () => {
    render(<OperatorHomeContinueSetupCard canBegin={false} blockerMessage={OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER} />);

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(screen.getByTestId("operator-home-readiness-blocker")).toHaveTextContent(
      OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    );
    expect(screen.queryByTestId("operator-home-setup-checklist")).toBeNull();
    expect(screen.queryByTestId("continue-setup-connect-cloud")).toBeNull();
    expect(screen.queryByTestId("continue-setup-invite-reviewer")).toBeNull();
    expect(screen.queryByText(/of \d+ complete/i)).not.toBeInTheDocument();
  });
});
