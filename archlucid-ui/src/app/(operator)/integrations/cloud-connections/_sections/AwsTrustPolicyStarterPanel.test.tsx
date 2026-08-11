import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AwsTrustPolicyStarterPanel } from "./AwsTrustPolicyStarterPanel";

describe("AwsTrustPolicyStarterPanel", () => {
  it("marks placeholder federation identifiers visibly and links intro sources (P0-1)", () => {
    render(<AwsTrustPolicyStarterPanel />);

    expect(screen.getByTestId("aws-trust-starter-placeholder-issuer")).toHaveTextContent("Replace");
    expect(screen.getByTestId("aws-trust-starter-placeholder-subject")).toHaveTextContent("Replace");
    expect(screen.getByTestId("aws-trust-starter-placeholder-oidc-provider-arn")).toHaveTextContent("Replace");
    expect(screen.getByTestId("aws-trust-starter-confirmed-audience")).toHaveTextContent("Confirmed");

    expect(screen.getByRole("link", { name: "Connection status" })).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
    expect(screen.getByRole("link", { name: "Connect AWS securely" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/aws",
    );
  });

  it("does not change the copy button label to Copied after copying the template (P0-1)", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<AwsTrustPolicyStarterPanel />);

    const copyButton = screen.getByTestId("aws-trust-starter-trust-policy-copy");
    fireEvent.click(copyButton);

    expect(copyButton).toHaveTextContent("Copy trust policy");
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("replace placeholders");
    });
  });
});
