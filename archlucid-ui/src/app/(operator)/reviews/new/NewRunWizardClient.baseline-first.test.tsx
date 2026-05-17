import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const baselineSearchParams = new URLSearchParams("baseline=1");

const { createArchitectureRunMock, getRunSummaryMock } = vi.hoisted(() => ({
  createArchitectureRunMock: vi.fn(),
  getRunSummaryMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => baselineSearchParams,
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRunMock(...args),
  getRunSummary: (...args: unknown[]) => getRunSummaryMock(...args),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    hasMore: false,
  }),
}));

import { NewRunWizardClient } from "./NewRunWizardClient";

function makeArchLucidPackageZip(): File {
  const manifest = {
    schemaVersion: 1,
    scriptVersion: "0.2.0",
    collectionTimestamp: "2026-05-17T12:00:00.000Z",
    subscriptionId: "11111111-1111-1111-1111-111111111111",
    scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/MyRg",
  };
  const zipped = zipSync({ "manifest.json": strToU8(JSON.stringify(manifest)) });
  const blob = new Blob([zipped], { type: "application/zip" });

  return new File([blob], "azure-pack.zip", { type: "application/zip" });
}

async function clickPrimaryForward() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /^(Continue|Next)$/ }));
  });
}

describe("NewRunWizardClient baseline-first (?baseline=1)", { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

        if (url.includes("/v1/agent-execution/cost-preview")) {
          return {
            ok: true,
            json: async () => ({
              mode: "Simulator",
              maxCompletionTokens: 4096,
              estimatedCostUsd: null,
              estimatedCostUsdLow: null,
              estimatedCostUsdHigh: null,
              estimatedCostBasis: "stub",
              pricingUsesIllustrativeUsdRates: true,
              deploymentName: null,
            }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "baseline-run-1" } });
    getRunSummaryMock.mockResolvedValue({
      runId: "baseline-run-1",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inserts ZIP step, prefills from packager manifest, and submits after defaults", async () => {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-progress")).toBeInTheDocument();
    });

    expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent(/Step 1: Choose starting point/);

    await act(async () => {
      fireEvent.click(screen.getByTestId("wizard-start-blank"));
    });

    expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent(/Step 2: Upload extractor ZIP/);
    expect(screen.getByTestId("wizard-baseline-zip-field")).toBeInTheDocument();

    const zipInput = within(screen.getByTestId("wizard-baseline-zip-field")).getByLabelText("Azure packager ZIP");
    const zipFile = makeArchLucidPackageZip();

    await act(async () => {
      fireEvent.change(zipInput, { target: { files: [zipFile] } });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("wizard-azure-zip-error")).not.toBeInTheDocument();
    });

    await clickPrimaryForward();
    expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent(/Step 3: Identity & goals/);

    const systemName = screen.getByLabelText("System name") as HTMLInputElement;
    expect(systemName.value).toBe("MyRg");

    for (let i = 0; i < 4; i += 1) {
      await clickPrimaryForward();
    }

    expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent(/Step 7: Review/);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start Architecture Review" }));
    });

    expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent(/Step 8: Pipeline/);

    await waitFor(() => {
      expect(createArchitectureRunMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Track pipeline" })).toBeInTheDocument();
    });
  });
});
