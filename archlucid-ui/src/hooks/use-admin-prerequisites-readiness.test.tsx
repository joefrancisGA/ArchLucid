import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(),
}));

vi.mock("@/lib/billing-subscription-status-client", () => ({
  fetchBillingSubscriptionStatus: vi.fn(),
}));

vi.mock("@/lib/fetch-identity-providers-page-bundle-client", () => ({
  fetchIdentityProvidersPageBundle: vi.fn(),
}));

vi.mock("@/lib/fetch-admin-prerequisites-cloud-summary-client", () => ({
  fetchAdminPrerequisitesCloudConnectionsSummary: vi.fn(),
}));

// Keeps the host config-lint probe out of the readiness set, so the test needs no lint fixture.
vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => false,
}));

const authorityLoading = { current: false };

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: { authorityRank: 40 },
    isAuthorityLoading: authorityLoading.current,
  }),
}));

import type { AdminIdentityProvidersPageBundleResponse } from "@/lib/fetch-identity-providers-page-bundle-client";
import { useAdminPrerequisitesReadiness } from "@/hooks/use-admin-prerequisites-readiness";
import { fetchAdminPrerequisitesCloudConnectionsSummary } from "@/lib/fetch-admin-prerequisites-cloud-summary-client";
import { fetchBillingSubscriptionStatus } from "@/lib/billing-subscription-status-client";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { fetchIdentityProvidersPageBundle } from "@/lib/fetch-identity-providers-page-bundle-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const mockFetchHealth = vi.mocked(fetchHealthReadySummary);
const mockFetchBilling = vi.mocked(fetchBillingSubscriptionStatus);
const mockFetchIdentityBundle = vi.mocked(fetchIdentityProvidersPageBundle);
const mockFetchCloudSummary = vi.mocked(fetchAdminPrerequisitesCloudConnectionsSummary);

/** Diagnostics are reported as available but empty, which reads as "sign-in not configured". */
const UNCONFIGURED_IDENTITY_BUNDLE = {
  authConfigurationDiagnostics: null,
  identityProviderDiagnostics: null,
  oidcDiagnostics: null,
  samlOperationalHealth: null,
} as unknown as AdminIdentityProvidersPageBundleResponse;

function ReadinessProbe({ enabled }: { readonly enabled: boolean }): React.JSX.Element {
  const { phase, rows, allReady } = useAdminPrerequisitesReadiness(enabled);

  return (
    <div>
      <span data-testid="phase">{phase}</span>
      <span data-testid="all-ready">{allReady ? "yes" : "no"}</span>
      <span data-testid="rows">{rows.map((row) => `${row.id}:${row.status}`).join(",")}</span>
    </div>
  );
}

async function waitForReady(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId("phase")).toHaveTextContent("ready");
  });
}

describe("useAdminPrerequisitesReadiness", () => {
  beforeEach(() => {
    authorityLoading.current = false;
    mockFetchHealth.mockReset();
    mockFetchBilling.mockReset();
    mockFetchIdentityBundle.mockReset();
    mockFetchCloudSummary.mockReset();

    mockFetchHealth.mockResolvedValue({ status: "Healthy" } as never);
    mockFetchBilling.mockResolvedValue({ isPaymentPastDue: false } as never);
    mockFetchIdentityBundle.mockResolvedValue(UNCONFIGURED_IDENTITY_BUNDLE);
    mockFetchCloudSummary.mockResolvedValue({ anyConfigured: true });
  });

  it("probes nothing while disabled", () => {
    renderWithOperatorQuery(<ReadinessProbe enabled={false} />);

    expect(screen.getByTestId("phase")).toHaveTextContent("ready");
    expect(screen.getByTestId("rows")).toBeEmptyDOMElement();
    expect(mockFetchIdentityBundle).not.toHaveBeenCalled();
    expect(mockFetchCloudSummary).not.toHaveBeenCalled();
  });

  it("stays loading until every probe settles", async () => {
    renderWithOperatorQuery(<ReadinessProbe enabled />);

    expect(screen.getByTestId("phase")).toHaveTextContent("loading");

    await waitForReady();
  });

  it("reports a configured cloud connection as met", async () => {
    renderWithOperatorQuery(<ReadinessProbe enabled />);
    await waitForReady();

    // A met row is filtered out of the unmet list rather than reported as ready.
    expect(screen.getByTestId("rows")).not.toHaveTextContent("cloud-connection");
  });

  it("reports an unconfigured cloud connection as needing attention", async () => {
    mockFetchCloudSummary.mockResolvedValue({ anyConfigured: false });

    renderWithOperatorQuery(<ReadinessProbe enabled />);
    await waitForReady();

    expect(screen.getByTestId("rows")).toHaveTextContent("cloud-connection:attention");
  });

  it("omits the cloud row when the probe fails, rather than claiming nothing is connected", async () => {
    mockFetchCloudSummary.mockRejectedValue(new Error("forbidden"));

    renderWithOperatorQuery(<ReadinessProbe enabled />);
    await waitForReady();

    expect(screen.getByTestId("rows")).not.toHaveTextContent("cloud-connection");
  });

  it("reports sign-in as unconfigured when diagnostics load but are empty", async () => {
    renderWithOperatorQuery(<ReadinessProbe enabled />);
    await waitForReady();

    expect(screen.getByTestId("rows")).toHaveTextContent("corporate-sign-in:attention");
    expect(screen.getByTestId("all-ready")).toHaveTextContent("no");
  });

  it("reports sign-in as unknown when identity diagnostics fail to load", async () => {
    mockFetchIdentityBundle.mockRejectedValue(new Error("forbidden"));

    renderWithOperatorQuery(<ReadinessProbe enabled />);
    await waitForReady();

    expect(screen.getByTestId("rows")).toHaveTextContent("corporate-sign-in:unknown");
  });

  it("waits for authority before probing", () => {
    authorityLoading.current = true;

    renderWithOperatorQuery(<ReadinessProbe enabled />);

    expect(screen.getByTestId("phase")).toHaveTextContent("loading");
    expect(mockFetchIdentityBundle).not.toHaveBeenCalled();
  });
});
