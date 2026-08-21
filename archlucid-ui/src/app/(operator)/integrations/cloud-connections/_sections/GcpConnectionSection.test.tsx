import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GcpConnectionDataProvider } from "./GcpConnectionDataContext";
import { GcpConnectionSection } from "./GcpConnectionSection";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const listGcpTier2Connections = vi.fn(async () => []);
const configureGcpTier2Connection = vi.fn(async () => undefined);
const disconnectGcpTier2Connection = vi.fn(async () => undefined);

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: (...args: unknown[]) => listGcpTier2Connections(...args),
  configureGcpTier2Connection: (...args: unknown[]) => configureGcpTier2Connection(...args),
  disconnectGcpTier2Connection: (...args: unknown[]) => disconnectGcpTier2Connection(...args),
  triggerGcpTier2HostedRun: vi.fn(),
}));

describe("GcpConnectionSection", () => {
  beforeEach(() => {
    listGcpTier2Connections.mockReset();
    listGcpTier2Connections.mockResolvedValue([]);
    configureGcpTier2Connection.mockReset();
    configureGcpTier2Connection.mockResolvedValue(undefined);
    disconnectGcpTier2Connection.mockReset();
    disconnectGcpTier2Connection.mockResolvedValue(undefined);
  });

  it("TB-1772: empty state uses guided wizard steps instead of a flat form", async () => {
    render(
      <GcpConnectionDataProvider>
        <GcpConnectionSection embedded />
      </GcpConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("gcp-connection-wizard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("gcp-connection-wizard-step-ids")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: GCP project ID" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Workload Identity Pool provider" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Read-only service account email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByTestId("gcp-connect-submit")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("gcp-project-id"), { target: { value: "my-gcp-project" } });
    fireEvent.change(screen.getByTestId("gcp-pool-provider"), {
      target: {
        value:
          "//iam.googleapis.com/projects/my-gcp-project/locations/global/workloadIdentityPools/archlucid/providers/archlucid",
      },
    });
    fireEvent.change(screen.getByTestId("gcp-service-account-email"), {
      target: { value: "archlucid-readonly@my-gcp-project.iam.gserviceaccount.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("gcp-connection-wizard-step-save")).toBeInTheDocument();
  });

  it("requires confirmation before disconnecting a saved connection", async () => {
    listGcpTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "gcp-1",
        projectId: "my-gcp-project",
        workloadIdentityPoolProvider:
          "projects/my-gcp-project/locations/global/workloadIdentityPools/pool/providers/provider",
        serviceAccountEmail: "archlucid@my-gcp-project.iam.gserviceaccount.com",
        status: "connected",
        lastPolledUtc: null,
        updatedUtc: null,
      },
    ]);

    render(
      <GcpConnectionDataProvider>
        <GcpConnectionSection embedded />
      </GcpConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("gcp-disconnect-gcp-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("gcp-disconnect-gcp-1"));

    const heading = screen.getByRole("heading", { name: /Disconnect GCP project my-gcp-project/i });
    const dialog = heading.closest('[role="alertdialog"]');

    expect(dialog).not.toBeNull();
    expect(disconnectGcpTier2Connection).not.toHaveBeenCalled();

    fireEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      expect(disconnectGcpTier2Connection).toHaveBeenCalledWith("gcp-1");
    });
  });

  it("shows a failed disconnect inside the dialog rather than behind the overlay", async () => {
    listGcpTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "gcp-2",
        projectId: "other-project",
        workloadIdentityPoolProvider:
          "projects/other-project/locations/global/workloadIdentityPools/pool/providers/provider",
        serviceAccountEmail: "archlucid@other-project.iam.gserviceaccount.com",
        status: "connected",
        lastPolledUtc: null,
        updatedUtc: null,
      },
    ]);
    disconnectGcpTier2Connection.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <GcpConnectionDataProvider>
        <GcpConnectionSection embedded />
      </GcpConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("gcp-disconnect-gcp-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("gcp-disconnect-gcp-2"));

    const heading = screen.getByRole("heading", { name: /Disconnect GCP project other-project/i });
    const dialog = heading.closest('[role="alertdialog"]');

    fireEvent.click(within(dialog as HTMLElement).getByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      expect(screen.getByTestId("gcp-connection-disconnect-error")).toBeInTheDocument();
    });

    expect(heading).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
