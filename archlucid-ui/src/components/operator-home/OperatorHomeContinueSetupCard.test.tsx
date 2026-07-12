import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_CONTINUE_SETUP_BODY,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
} from "@/lib/buyer-polish-copy";

import { OperatorHomeContinueSetupCard } from "./OperatorHomeContinueSetupCard";

describe("OperatorHomeContinueSetupCard", () => {
  it("renders compact ready-to-begin reassurance without optional setup clutter", () => {
    render(<OperatorHomeContinueSetupCard canBegin blockerMessage={null} />);

    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_READY_TO_BEGIN_TITLE });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(screen.getByText(OPERATOR_HOME_CONTINUE_SETUP_BODY)).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-setup-checklist")).toBeNull();
    expect(screen.queryByTestId("continue-setup-connect-cloud")).toBeNull();
    expect(screen.queryByTestId("continue-setup-invite-reviewer")).toBeNull();
    expect(screen.queryByText(/of \d+ complete/i)).not.toBeInTheDocument();
  });

  it("shows an explicit blocker instead of fractional readiness counts", () => {
    render(<OperatorHomeContinueSetupCard canBegin={false} blockerMessage={OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER} />);

    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-readiness-blocker")).toHaveTextContent(
      OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    );
    expect(screen.queryByText(/of \d+ complete/i)).not.toBeInTheDocument();
  });
});
