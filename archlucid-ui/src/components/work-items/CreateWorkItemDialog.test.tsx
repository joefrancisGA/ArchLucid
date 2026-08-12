import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { CreateWorkItemDialog } from "./CreateWorkItemDialog";
import type { ArchitectureWorkItemPreview } from "@/lib/architecture/architecture-work-item-model";
import type { ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import {
  CREATE_WORK_ITEM_API_FAILURE,
  CREATE_WORK_ITEM_INVALID_CONNECTION,
  CREATE_WORK_ITEM_NO_PROVIDER_AUTHORIZED,
  CREATE_WORK_ITEM_NO_PROVIDER_UNAUTHORIZED,
} from "@/lib/create-work-item-copy";

const listItsmFindingCorrelations = vi.fn();
const createItsmOutboundIssue = vi.fn();
const writeWorkItemBodyToClipboard = vi.fn();
const useNavCallerAuthorityRank = vi.fn(() => 1);
const useItsmNativeCreateReadiness = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelations: (...args: unknown[]) => listItsmFindingCorrelations(...args),
  createItsmOutboundIssue: (...args: unknown[]) => createItsmOutboundIssue(...args),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateReadiness: () => useItsmNativeCreateReadiness(),
  useItsmNativeCreateEnabled: () => useItsmNativeCreateReadiness().defaultPathReady,
}));

vi.mock("@/lib/copy-finding-as-work-item", () => ({
  writeWorkItemBodyToClipboard: (...args: unknown[]) => writeWorkItemBodyToClipboard(...args),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: useNavCallerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: useNavCallerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

const preview: ArchitectureWorkItemPreview = {
  title: "Implement architecture — Payments",
  description: "Overview",
  priority: "High",
  owner: "Platform team",
  findingsIncluded: [
    {
      findingId: "finding-001",
      title: "Encrypt data at rest",
      severityLabel: "High",
      recommendedAction: "Enable encryption.",
    },
  ],
  sourceArchitectureLink: "https://app.archlucid.test/architecture/reviews/run-1",
};

function mockReadiness(health: ItsmIntegrationHealthResponse): void {
  useItsmNativeCreateReadiness.mockReturnValue({
    deploymentEnabled: health.nativeEnabled === true,
    defaultPathReady: health.nativeEnabled === true,
    health,
    azureBoardsReady: false,
  });
}

function renderDialog(overrides?: Partial<React.ComponentProps<typeof CreateWorkItemDialog>>) {
  const onOpenChange = vi.fn();

  render(
    <CreateWorkItemDialog
      open
      onOpenChange={onOpenChange}
      runId="run-1"
      preview={preview}
      nativeCreateFindingId="finding-001"
      {...overrides}
    />,
  );

  return { onOpenChange };
}

describe("CreateWorkItemDialog", () => {
  beforeEach(() => {
    listItsmFindingCorrelations.mockReset();
    createItsmOutboundIssue.mockReset();
    writeWorkItemBodyToClipboard.mockReset();
    useNavCallerAuthorityRank.mockReset();
    useItsmNativeCreateReadiness.mockReset();
    useNavCallerAuthorityRank.mockReturnValue(1);
    listItsmFindingCorrelations.mockResolvedValue({ correlations: [] });
    writeWorkItemBodyToClipboard.mockResolvedValue(true);
  });

  it("shows connect guidance when neither provider is configured for non-admin users", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: false, summary: "skip" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });

    renderDialog();

    expect(await screen.findByTestId("create-work-item-unconfigured")).toHaveTextContent(
      CREATE_WORK_ITEM_NO_PROVIDER_UNAUTHORIZED,
    );
    expect(screen.queryByTestId("create-work-item-configure-link")).not.toBeInTheDocument();
  });

  it("shows configure guidance for authorized users when no provider is configured", async () => {
    useNavCallerAuthorityRank.mockReturnValue(3);
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: false, summary: "skip" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });

    renderDialog();

    expect(await screen.findByTestId("create-work-item-unconfigured")).toHaveTextContent(
      CREATE_WORK_ITEM_NO_PROVIDER_AUTHORIZED,
    );
    expect(screen.getByTestId("create-work-item-configure-link")).toBeInTheDocument();
  });

  it("defaults to Jira when only Jira is configured", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });

    renderDialog();

    expect(await screen.findByTestId("create-work-item-single-provider")).toHaveTextContent("Jira");
    expect(screen.queryByTestId("create-work-item-provider-select")).not.toBeInTheDocument();
    expect(screen.getByTestId("create-work-item-native-submit")).not.toBeDisabled();
  });

  it("defaults to ServiceNow when only ServiceNow is configured", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: false, summary: "skip" },
      serviceNow: { locallyConfigured: true, reachable: true, summary: "ready" },
    });

    renderDialog();

    expect(await screen.findByTestId("create-work-item-single-provider")).toHaveTextContent("ServiceNow");
  });

  it("shows a provider picker when both connectors are configured", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: true, reachable: true, summary: "ready" },
    });

    renderDialog();

    expect(await screen.findByTestId("create-work-item-provider-select")).toBeInTheDocument();
  });

  it("disables native create for invalid connections but still allows copy", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: false, summary: "token expired" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });

    renderDialog();

    expect(await screen.findByTestId("create-work-item-invalid-connection")).toHaveTextContent(
      CREATE_WORK_ITEM_INVALID_CONNECTION,
    );
    expect(screen.getByTestId("create-work-item-native-submit")).toBeDisabled();
    expect(screen.getByTestId("create-work-item-copy")).not.toBeDisabled();
  });

  it("surfaces provider API failures without closing the dialog", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });
    createItsmOutboundIssue.mockRejectedValue(new Error("vendor timeout"));

    const { onOpenChange } = renderDialog();

    await screen.findByTestId("create-work-item-native-submit");
    fireEvent.click(screen.getByTestId("create-work-item-native-submit"));

    expect(await screen.findByText("vendor timeout")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("creates a linked work item successfully", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });
    createItsmOutboundIssue.mockResolvedValue({
      provider: "Jira",
      externalKey: "ARCH-42",
    });

    const { onOpenChange } = renderDialog();

    await screen.findByTestId("create-work-item-native-submit");
    fireEvent.click(screen.getByTestId("create-work-item-native-submit"));

    await waitFor(() => {
      expect(createItsmOutboundIssue).toHaveBeenCalledWith("finding-001", "Jira");
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("falls back to a generic API failure message when the provider throws a non-error", async () => {
    mockReadiness({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    });
    createItsmOutboundIssue.mockRejectedValue("broken");

    renderDialog();

    await screen.findByTestId("create-work-item-native-submit");
    fireEvent.click(screen.getByTestId("create-work-item-native-submit"));

    expect(await screen.findByText(CREATE_WORK_ITEM_API_FAILURE)).toBeInTheDocument();
  });
});
