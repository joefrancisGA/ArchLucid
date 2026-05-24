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

  it("defaults to the simplified pilot wizard, prefills from ZIP, and submits in three steps", async () => {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-wizard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 1 of 3/i);
    expect(screen.getByTestId("wizard-baseline-zip-field")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pilot wizard (3 steps)" })).toHaveAttribute("aria-pressed", "true");

    const zipInput = within(screen.getByTestId("wizard-baseline-zip-field")).getByLabelText("Azure packager ZIP");
    const zipFile = makeArchLucidPackageZip();

    await act(async () => {
      fireEvent.change(zipInput, { target: { files: [zipFile] } });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("wizard-azure-zip-error")).not.toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 2 of 3/i);

    const systemName = screen.getByLabelText("System name") as HTMLInputElement;
    expect(systemName.value).toBe("MyRg");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 3 of 3/i);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start Architecture Review" }));
    });

    await waitFor(() => {
      expect(createArchitectureRunMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Track pipeline" })).toBeInTheDocument();
    });
  });
});
