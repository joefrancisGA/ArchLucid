import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsState = {
  value: new URLSearchParams(),
};

const { createArchitectureRunMock, uploadAzureExtractorPackageMock, saveTenantReviewCycleBaselineMock } =
  vi.hoisted(() => ({
    createArchitectureRunMock: vi.fn(),
    uploadAzureExtractorPackageMock: vi.fn(),
    saveTenantReviewCycleBaselineMock: vi.fn(),
  }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => searchParamsState.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRunMock(...args),
  getRunSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    hasMore: false,
  }),
}));

vi.mock("@/lib/upload-azure-extractor-package", () => ({
  uploadAzureExtractorPackage: (...args: unknown[]) => uploadAzureExtractorPackageMock(...args),
}));

vi.mock("@/lib/save-tenant-review-cycle-baseline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/save-tenant-review-cycle-baseline")>();

  return {
    ...actual,
    saveTenantReviewCycleBaseline: (...args: unknown[]) => saveTenantReviewCycleBaselineMock(...args),
  };
});

vi.mock("@/app/(operator)/architecture/reviews/new/NewRunWizardDeferredChunks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/(operator)/architecture/reviews/new/NewRunWizardDeferredChunks")>();
  return {
    ...actual,
    WizardPostCreateEvidenceUploadPanel: (await import("@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel")).WizardPostCreateEvidenceUploadPanel,
    WizardStepTrack: (await import("@/components/wizard/steps/WizardStepTrack")).WizardStepTrack,
  };
});

import { NewRunWizardClient } from "./NewRunWizardClient";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { optIntoAdvancedNewRunWizardConfiguration } from "./new-run-wizard-test-helpers";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

function createValidInventoryZip(name: string): File {
  return new File(
    [
      zipSync({
        "manifest.json": strToU8(
          JSON.stringify({
            schemaVersion: 1,
            scriptVersion: "1.0.0",
            collectionTimestamp: "2026-06-25T12:00:00.000Z",
            subscriptionId: "11111111-1111-1111-1111-111111111111",
            scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/Rg",
          }),
        ),
        "resources.json": strToU8("[]"),
      }),
    ],
    name,
    { type: "application/zip" },
  );
}

describe("NewRunWizardClient (evidence upload step)", { timeout: 60_000 }, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    searchParamsState.value = new URLSearchParams();
    window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "full");
    createArchitectureRunMock.mockReset();
    uploadAzureExtractorPackageMock.mockReset();
    saveTenantReviewCycleBaselineMock.mockReset();
    saveTenantReviewCycleBaselineMock.mockResolvedValue({ ok: true });

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
              estimatedCostBasis: "Simulator",
              pricingUsesIllustrativeUsdRates: true,
              deploymentName: null,
            }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
  });

  async function clickPrimaryForward(): Promise<void> {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^(Continue|Next)$/ }));
    });
  }

  async function advanceFromIdentityToReview(): Promise<void> {
    fireEvent.change(screen.getByLabelText("System name"), { target: { value: "EvidencePilotApp" } });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: {
        value: "Evidence upload wizard path validates optional Azure extractor ZIP before pipeline tracking.",
      },
    });

    for (let i = 0; i < 4; i += 1) {
      await clickPrimaryForward();
    }

    await waitFor(() => {
      expect(screen.getByTestId("wizard-baseline-metrics-step")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("wizard-baseline-review-cycle-hours"), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByTestId("wizard-baseline-confidence"), {
      target: { value: "measured" },
    });

    await clickPrimaryForward();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Review & submit" })).toBeInTheDocument();
    });
  }
  async function advanceToEvidenceStep(): Promise<void> {
    render(<NewRunWizardClient />);

    await optIntoAdvancedNewRunWizardConfiguration();

    fireEvent.click(screen.getByRole("button", { name: /All steps/i }));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-start-blank")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("wizard-start-blank"));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
    });
  }

  async function selectAzureInventoryEvidenceSource(): Promise<void> {
    fireEvent.click(screen.getByTestId("wizard-evidence-source-azure-export"));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-dropzone")).toBeInTheDocument();
    });
  }

  it("renders the optional evidence step after preset selection", async () => {
    await advanceToEvidenceStep();
    await selectAzureInventoryEvidenceSource();

    expect(screen.getByTestId("wizard-evidence-upload-dropzone")).toBeInTheDocument();
  });

  it("advances without upload when skip demo data is selected", async () => {
    await advanceToEvidenceStep();

    fireEvent.click(screen.getByTestId("wizard-evidence-source-demo"));
    fireEvent.click(screen.getByTestId("wizard-evidence-upload-skip-demo"));

    await waitFor(() => {
      expect(screen.getByLabelText("System name")).toBeInTheDocument();
    });

    expect(uploadAzureExtractorPackageMock).not.toHaveBeenCalled();
  });

  it("uploads evidence after review creation when a file was selected", async () => {
    await advanceToEvidenceStep();
    await selectAzureInventoryEvidenceSource();

    const zipFile = createValidInventoryZip("evidence.zip");
    const input = screen.getByTestId("wizard-evidence-upload-dropzone-input");

    fireEvent.change(input, { target: { files: [zipFile] } });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-selected")).toHaveTextContent("evidence.zip");
    });

    await clickPrimaryForward();

    await waitFor(() => {
      expect(screen.getByLabelText("System name")).toBeInTheDocument();
    });

    createArchitectureRunMock.mockResolvedValue({ run: { runId: "evidence-run-1" } });
    uploadAzureExtractorPackageMock.mockResolvedValue({ ok: true, packageId: "pkg-1" });

    await advanceFromIdentityToReview();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await waitFor(() => {
      expect(createArchitectureRunMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(uploadAzureExtractorPackageMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "evidence.zip" }),
        expect.objectContaining({
          runId: "evidence-run-1",
          onUploadProgress: expect.any(Function),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-success")).toBeInTheDocument();
    });
  });

  it("shows inline upload failure on the tracking step without blocking review creation", async () => {
    await advanceToEvidenceStep();
    await selectAzureInventoryEvidenceSource();

    const zipFile = createValidInventoryZip("bad-evidence.zip");
    const input = screen.getByTestId("wizard-evidence-upload-dropzone-input");

    fireEvent.change(input, { target: { files: [zipFile] } });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-selected")).toHaveTextContent("bad-evidence.zip");
    });

    await clickPrimaryForward();

    await waitFor(() => {
      expect(screen.getByLabelText("System name")).toBeInTheDocument();
    });

    createArchitectureRunMock.mockResolvedValue({ run: { runId: "evidence-run-2" } });
    uploadAzureExtractorPackageMock.mockResolvedValue({
      ok: false,
      message: "Upload rejected",
      problem: null,
      correlationId: "corr-1",
    });

    await advanceFromIdentityToReview();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-failure")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Track review progress" })).toBeInTheDocument();
  });
});
