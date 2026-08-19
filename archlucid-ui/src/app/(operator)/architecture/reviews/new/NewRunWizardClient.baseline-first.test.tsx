import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const baselineSearchParams = new URLSearchParams("baseline=1");

const {
  createArchitectureRunMock,
  getRunSummaryMock,
  saveTenantReviewCycleBaselineMock,
  uploadAzureExtractorPackageMock,
} = vi.hoisted(() => ({
  createArchitectureRunMock: vi.fn(),
  getRunSummaryMock: vi.fn(),
  saveTenantReviewCycleBaselineMock: vi.fn(),
  uploadAzureExtractorPackageMock: vi.fn(),
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

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => baselineSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

vi.mock("@/lib/save-tenant-review-cycle-baseline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/save-tenant-review-cycle-baseline")>();

  return {
    ...actual,
    saveTenantReviewCycleBaseline: (...args: unknown[]) => saveTenantReviewCycleBaselineMock(...args),
  };
});

vi.mock("@/lib/upload-azure-extractor-package", () => ({
  uploadAzureExtractorPackage: (...args: unknown[]) => uploadAzureExtractorPackageMock(...args),
}));

import { NewRunWizardClient } from "./NewRunWizardClient";
import { uploadBaselineWizardZip } from "@/testing/wizard-baseline-zip-test-helpers";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

function makeArchLucidPackageZip(): File {
  const manifest = {
    schemaVersion: 1,
    scriptVersion: "0.2.0",
    collectionTimestamp: "2026-05-17T12:00:00.000Z",
    subscriptionId: "11111111-1111-1111-1111-111111111111",
    scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/MyRg",
  };
  const zipped = zipSync({
    "manifest.json": strToU8(JSON.stringify(manifest)),
    "resources.json": strToU8("[]"),
  });
  const blob = new Blob([zipped], { type: "application/zip" });

  return new File([blob], "azure-pack.zip", { type: "application/zip" });
}

describe("NewRunWizardClient baseline-first (?baseline=1)", { timeout: 60_000 }, () => {
  beforeEach(() => {
    window.localStorage.removeItem(WIZARD_MODE_STORAGE_KEY);
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

        if (url.includes("/v1/tenant/baseline")) {
          return {
            ok: true,
            json: async () => ({ baselineReviewCycleHours: null }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "baseline-run-1" } });
    saveTenantReviewCycleBaselineMock.mockResolvedValue({ ok: true });
    uploadAzureExtractorPackageMock.mockResolvedValue({ ok: true, packageId: "baseline-pkg-1" });
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

  it("defaults to the simplified pilot wizard, prefills from ZIP, captures baseline, and submits in four steps", async () => {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-wizard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 1 of 4/i);
    expect(screen.getByLabelText("System name")).toBeInTheDocument();
    expect(screen.queryByTestId("new-run-wizard-mode-toggle")).not.toBeInTheDocument();

    const description = screen.getByLabelText("Description") as HTMLTextAreaElement;

    if (description.value.trim().length < 10) {
      fireEvent.change(description, {
        target: {
          value:
            "Ten char min: assess this architecture for security, cost, and governance before production rollout.",
        },
      });
    }

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 2 of 4/i);

    await uploadBaselineWizardZip(makeArchLucidPackageZip());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 3 of 4/i);
    expect(screen.getByTestId("wizard-baseline-metrics-step")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("wizard-baseline-review-cycle-hours"), {
      target: { value: "40" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });

    await waitFor(() => {
      expect(saveTenantReviewCycleBaselineMock).toHaveBeenCalledWith({
        baselineReviewCycleHours: 40,
        baselineReviewCycleSourceNote: "wizard: Not sure (leave blank)",
      });
    });

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 4 of 4/i);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start Architecture Review" }));
    });

    await waitFor(() => {
      expect(createArchitectureRunMock).toHaveBeenCalled();
    });

    const createPayload = createArchitectureRunMock.mock.calls[0]?.[0] as { systemName?: string } | undefined;
    expect(createPayload?.systemName).toBe("MyRg");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Track review progress" })).toBeInTheDocument();
    });
  });
});
