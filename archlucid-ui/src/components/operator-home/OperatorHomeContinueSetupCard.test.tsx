import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_CONNECT_CLOUD_BODY,
  OPERATOR_HOME_CONTINUE_SETUP_BODY,
  OPERATOR_HOME_INVITE_COLLABORATORS_BODY,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
  OPERATOR_HOME_SETUP_STATUS_OPTIONAL,
  OPERATOR_HOME_SETUP_STATUS_READY,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";

import { OperatorHomeContinueSetupCard } from "./OperatorHomeContinueSetupCard";

describe("OperatorHomeContinueSetupCard", () => {
  it("renders ready-to-begin copy with explicit optional setup items", () => {
    render(<OperatorHomeContinueSetupCard canBegin blockerMessage={null} />);

    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_READY_TO_BEGIN_TITLE });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(screen.getByText(OPERATOR_HOME_CONTINUE_SETUP_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-setup-workspace-access-status")).toHaveTextContent(
      OPERATOR_HOME_SETUP_STATUS_READY,
    );
    expect(screen.getByTestId("operator-home-setup-cloud-status")).toHaveTextContent(
      OPERATOR_HOME_SETUP_STATUS_OPTIONAL,
    );
    expect(screen.getByTestId("operator-home-setup-reviewer-status")).toHaveTextContent(
      OPERATOR_HOME_SETUP_STATUS_OPTIONAL,
    );
    expect(screen.getByRole("heading", { level: 3, name: PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL })).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_CONNECT_CLOUD_BODY)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_INVITE_COLLABORATORS_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/of \d+ complete/i)).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_PATH,
    );
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER })).toHaveAttribute(
      "href",
      INVITE_REVIEWER_PATH,
    );
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
