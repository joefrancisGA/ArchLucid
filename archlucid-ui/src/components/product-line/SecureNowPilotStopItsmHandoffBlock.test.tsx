import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowPilotStopItsmHandoffBlock } from "./SecureNowPilotStopItsmHandoffBlock";

describe("SecureNowPilotStopItsmHandoffBlock", () => {
  it("links to ITSM onboarding runbooks when no finding is in scope", () => {
    render(
      <SecureNowPilotStopItsmHandoffBlock pathId="path-9" rationale="Stop for pilot" handoffTestId="handoff" />,
    );

    const link = screen.getByTestId("handoff");
    expect(link).toHaveTextContent("Draft ITSM outbound handoff");
    expect(link.getAttribute("href")).toMatch(/integrations\/itsm/);
    expect(link.getAttribute("href")).toMatch(/pilotStopPathId=path-9/);
  });
});
