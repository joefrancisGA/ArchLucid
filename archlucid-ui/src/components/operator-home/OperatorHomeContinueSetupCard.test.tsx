import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { OPERATOR_HOME_CARD_SECTION_HEADING, INLINE_GUIDANCE_LABEL_CLASS } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_CONTINUE_SETUP_BODY,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";

import { OperatorHomeContinueSetupCard } from "./OperatorHomeContinueSetupCard";

describe("OperatorHomeContinueSetupCard", () => {
  it("renders the Continue setup card with setup guide CTA", () => {
    render(<OperatorHomeContinueSetupCard />);

    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 2, name: "Continue setup" });

    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
    expect(screen.getByTestId("inline-guidance-optional-setup")).toHaveTextContent(
      PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
    );
    expect(screen.getByTestId("inline-guidance-optional-setup")).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(screen.getByText(OPERATOR_HOME_CONTINUE_SETUP_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/evidence checklist/i)).not.toBeInTheDocument();

    const setupGuideLink = screen.getByRole("link", { name: "Open setup guide" });

    expect(setupGuideLink).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_PATH,
    );
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER })).toHaveAttribute(
      "href",
      INVITE_REVIEWER_PATH,
    );
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER })).toBeInTheDocument();
    expect(screen.queryByText(/Continue getting started/i)).not.toBeInTheDocument();
  });

  it("shows optional setup readiness status when counts are provided", () => {
    render(<OperatorHomeContinueSetupCard readyCount={2} totalCount={4} loading={false} />);

    expect(screen.getByTestId("inline-guidance-setup-readiness")).toHaveTextContent("Setup readiness:");
    expect(screen.getByText("2 of 4 complete")).toBeInTheDocument();
  });

  it("keeps the setup CTA as a link (not a button) to the onboarding guide", () => {
    render(<OperatorHomeContinueSetupCard readyCount={1} totalCount={4} />);

    const setupGuideLink = screen.getByRole("link", { name: "Open setup guide" });

    expect(setupGuideLink).toHaveAttribute("href", "/onboarding");
    expect(screen.queryByRole("button", { name: "Open setup guide" })).not.toBeInTheDocument();
  });
});
