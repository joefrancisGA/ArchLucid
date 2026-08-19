import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const showError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
}));

import { HelpConnectAwsSecurelyTrustPolicyPanel } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyTrustPolicyPanel";
import { CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR } from "@/lib/connect-aws-securely-help-content";

describe("HelpConnectAwsSecurelyTrustPolicyPanel", () => {
  it("announces successful copy through a polite live region", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<HelpConnectAwsSecurelyTrustPolicyPanel />);

    fireEvent.click(screen.getByTestId("connect-aws-securely-trust-policy-copy"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      expect(screen.getByTestId("connect-aws-securely-trust-policy-copy-status")).toHaveTextContent(
        "Trust policy copied to clipboard.",
      );
    });
    expect(screen.getByTestId("connect-aws-securely-trust-policy-copy")).toHaveTextContent("Copied");
  });

  it("shows an error toast and keeps the copy label when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    showError.mockReset();

    render(<HelpConnectAwsSecurelyTrustPolicyPanel />);

    fireEvent.click(screen.getByTestId("connect-aws-securely-trust-policy-copy"));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("AWS trust policy", CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR);
    });
    expect(screen.getByTestId("connect-aws-securely-trust-policy-copy")).toHaveTextContent("Copy trust policy");
    expect(screen.getByTestId("connect-aws-securely-trust-policy-copy-status")).toHaveTextContent(
      CONNECT_AWS_SECURELY_TRUST_POLICY_COPY_ERROR,
    );
  });
});
