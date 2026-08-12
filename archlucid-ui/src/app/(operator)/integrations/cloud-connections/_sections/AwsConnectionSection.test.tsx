import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AwsConnectionDataProvider } from "./AwsConnectionDataContext";
import { AwsConnectionSection } from "./AwsConnectionSection";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const listAwsTier2Connections = vi.fn(async () => []);
const configureAwsTier2Connection = vi.fn(async () => undefined);
const disconnectAwsTier2Connection = vi.fn(async () => undefined);

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: (...args: unknown[]) => listAwsTier2Connections(...args),
  configureAwsTier2Connection: (...args: unknown[]) => configureAwsTier2Connection(...args),
  disconnectAwsTier2Connection: (...args: unknown[]) => disconnectAwsTier2Connection(...args),
  triggerAwsTier2HostedRun: vi.fn(),
}));

describe("AwsConnectionSection", () => {
  it("disables Save until required fields validate and surfaces field errors (P0-4)", async () => {
    render(
      <AwsConnectionDataProvider>
        <AwsConnectionSection embedded />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-connect-submit")).toBeDisabled();
    });

    expect(screen.getByTestId("aws-connect-readiness")).toBeInTheDocument();

    const accountIdInput = screen.getByTestId("aws-account-id");
    fireEvent.focus(accountIdInput);
    fireEvent.blur(accountIdInput);

    expect(screen.getByText("AWS account ID must be a 12-digit number.", { selector: "#aws-account-id-error" })).toBeInTheDocument();
    expect(screen.getByTestId("aws-connect-submit")).toBeDisabled();
  });

  it("requires confirmation before disconnecting a saved connection (P0-6)", async () => {
    listAwsTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "conn-1",
        accountId: "123456789012",
        region: "us-east-1",
        roleArn: "arn:aws:iam::123456789012:role/ArchLucidReadOnly",
        status: "connected",
        lastPolledUtc: null,
        updatedUtc: null,
      },
    ]);

    render(
      <AwsConnectionDataProvider>
        <AwsConnectionSection embedded />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-disconnect-conn-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("aws-disconnect-conn-1"));

    const heading = screen.getByRole("heading", { name: /Disconnect AWS account 123456789012/i });
    const dialog = heading.closest('[role="alertdialog"]');

    expect(dialog).not.toBeNull();
    expect(disconnectAwsTier2Connection).not.toHaveBeenCalled();

    fireEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      expect(disconnectAwsTier2Connection).toHaveBeenCalledWith("conn-1");
    });
  });

  it("shows a failed disconnect inside the dialog rather than behind the overlay", async () => {
    listAwsTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "conn-2",
        accountId: "210987654321",
        region: "us-east-1",
        roleArn: "arn:aws:iam::210987654321:role/ArchLucidReadOnly",
        status: "connected",
        lastPolledUtc: null,
        updatedUtc: null,
      },
    ]);
    disconnectAwsTier2Connection.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AwsConnectionDataProvider>
        <AwsConnectionSection embedded />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-disconnect-conn-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("aws-disconnect-conn-2"));

    const heading = screen.getByRole("heading", { name: /Disconnect AWS account 210987654321/i });
    const dialog = heading.closest('[role="alertdialog"]');

    fireEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-disconnect-error")).toBeInTheDocument();
    });

    expect(heading).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
