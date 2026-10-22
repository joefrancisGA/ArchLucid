import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    listAwsTier2Connections.mockReset();
    listAwsTier2Connections.mockResolvedValue([]);
    configureAwsTier2Connection.mockReset();
    configureAwsTier2Connection.mockResolvedValue(undefined);
    disconnectAwsTier2Connection.mockReset();
    disconnectAwsTier2Connection.mockResolvedValue(undefined);
  });

  it("TB-1761: empty state uses guided wizard steps instead of a flat form", async () => {
    render(
      <AwsConnectionDataProvider>
        <AwsConnectionSection embedded />
      </AwsConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("aws-connection-wizard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("aws-connection-wizard-step-ids")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: AWS account ID" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Primary region" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Read-only IAM role ARN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByTestId("aws-connect-submit")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("aws-account-id"), { target: { value: "123456789012" } });
    fireEvent.change(screen.getByTestId("aws-role-arn"), {
      target: { value: "arn:aws:iam::123456789012:role/ArchLucidReadOnly" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("aws-connection-wizard-step-save")).toBeInTheDocument();
  });

  it("TB-1764: connected state exposes exactly one primary CTA in connection details", async () => {
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
      expect(screen.getByTestId("aws-connection-list")).toBeInTheDocument();
    });

    const actions = screen.getByTestId("aws-connection-primary-actions");
    expect(within(actions).getAllByRole("button")).toHaveLength(2);
    expect(within(actions).getByRole("button", { name: "Re-poll now" })).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
    expect(screen.queryByTestId("aws-connection-wizard")).not.toBeInTheDocument();
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
  });
});
