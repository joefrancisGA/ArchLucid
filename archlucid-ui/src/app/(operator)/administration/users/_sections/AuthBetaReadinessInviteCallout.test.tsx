import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthBetaReadinessInviteCallout } from "./AuthBetaReadinessInviteCallout";

const proxyJsonGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: proxyJsonGetMock,
}));

describe("AuthBetaReadinessInviteCallout (TB-928)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while diagnostics are loading", () => {
    proxyJsonGetMock.mockReturnValueOnce(new Promise(() => undefined));

    const { container } = render(<AuthBetaReadinessInviteCallout />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when diagnostics report no invite blockers", async () => {
    proxyJsonGetMock.mockResolvedValueOnce({
      operatorBaseUrlConfigured: true,
      localTrialIdentityConfigured: true,
    });

    const { container } = render(<AuthBetaReadinessInviteCallout />);

    await waitFor(() => {
      expect(proxyJsonGetMock).toHaveBeenCalled();
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("lists invite blockers and links to diagnostics when configuration is incomplete", async () => {
    proxyJsonGetMock.mockResolvedValueOnce({
      operatorBaseUrlConfigured: false,
      localTrialIdentityConfigured: false,
    });

    render(<AuthBetaReadinessInviteCallout diagnosticsHref="/administration/identity-providers/diagnostics" />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-beta-readiness-invite-callout")).toBeInTheDocument();
    });

    expect(screen.getByText("Private-beta invite readiness")).toBeInTheDocument();
    expect(screen.getByText("Invite email base URL")).toBeInTheDocument();
    expect(screen.getByText("Invite session signing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open identity provider diagnostics" })).toHaveAttribute(
      "href",
      "/administration/identity-providers/diagnostics",
    );
  });
});
