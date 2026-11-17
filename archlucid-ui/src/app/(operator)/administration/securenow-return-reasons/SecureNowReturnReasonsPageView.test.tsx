import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowReturnReasonsPageView } from "./SecureNowReturnReasonsPageView";

describe("SecureNow return reasons page", () => {
  it("renders the four existing destinations", () => {
    render(<SecureNowReturnReasonsPageView />);

    expect(screen.getByTestId("securenow-return-reasons-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When to come back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Awaiting verification" })).toHaveAttribute(
      "href",
      "/security/remediation-instances",
    );
    expect(screen.getByRole("link", { name: "Recent changes" })).toHaveAttribute(
      "href",
      "/infrastructure/snapshots-drift",
    );
    expect(screen.getByRole("link", { name: "Open questions" })).toHaveAttribute("href", "/infrastructure/diagrams");
    expect(screen.getByRole("link", { name: "Sponsor follow-up" })).toHaveAttribute(
      "href",
      "/administration/securenow-pilot-decision",
    );
  });

  it("keeps return reasons separate from reminder and usage claims", () => {
    const { container } = render(<SecureNowReturnReasonsPageView />);
    const text = container.textContent ?? "";

    expect(text).toMatch(/NO_GO/);
    expect(text).toMatch(/does not send a reminder/i);
    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/engagement score/i);
  });
});
