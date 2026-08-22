import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { buildDefaultWizardValues, wizardFormSchema, type WizardFormValues } from "@/lib/wizard-schema";
import { uploadBaselineWizardZip } from "@/testing/wizard-baseline-zip-test-helpers";

const createRun = vi.fn();
const saveTenantReviewCycleBaselineMock = vi.fn();

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createRun(...args),
}));

vi.mock("@/lib/save-tenant-review-cycle-baseline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/save-tenant-review-cycle-baseline")>();

  return {
    ...actual,
    saveTenantReviewCycleBaseline: (...args: unknown[]) => saveTenantReviewCycleBaselineMock(...args),
  };
});

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";
import { showError } from "@/lib/toast";

import { SimplifiedPilotWizard } from "./SimplifiedPilotWizard";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";

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

function Harness() {
  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: buildDefaultWizardValues(),
    mode: "onBlur",
  });

  return (
    <FormProvider {...form}>
      <SimplifiedPilotWizard
        llmBudgetStatus={null}
        blocksLlmExecution={false}
        onRunCreated={() => {
          /* test double */
        }}
      />
    </FormProvider>
  );
}

describe("SimplifiedPilotWizard", () => {
  beforeEach(() => {
    saveTenantReviewCycleBaselineMock.mockReset();
    saveTenantReviewCycleBaselineMock.mockResolvedValue({ ok: true });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

        if (url.includes("/v1/tenant/baseline")) {
          return {
            ok: true,
            json: async () => ({ baselineReviewCycleHours: null }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("walks four steps, prefills from ZIP, captures baseline, and submits createArchitectureRun", async () => {
    createRun.mockResolvedValue({ run: { runId: "pilot-run-1" } });

    render(<Harness />);

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 1 of 4/i);
    expect(screen.getByLabelText("System name")).toBeInTheDocument();

    const description = screen.getByLabelText("Description") as HTMLTextAreaElement;

    if (description.value.trim().length < 10) {
      fireEvent.change(description, {
        target: {
          value:
            "Ten char min: assess this architecture for security, cost, and governance before production rollout.",
        },
      });
    }

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 2 of 4/i);
    });

    await uploadBaselineWizardZip(makeArchLucidPackageZip());

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 3 of 4/i);
    });

    fireEvent.change(screen.getByTestId("wizard-baseline-review-cycle-hours"), {
      target: { value: "24" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(saveTenantReviewCycleBaselineMock).toHaveBeenCalledWith({
        baselineReviewCycleHours: 24,
        baselineReviewCycleSourceNote: "wizard: Not sure (leave blank)",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 4 of 4/i);
    });

    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });

    const createPayload = createRun.mock.calls[0]?.[0] as { systemName?: string } | undefined;
    expect(createPayload?.systemName).toBe("MyRg");
  });

  it("exposes advanced configuration behind an accordion on step 1", () => {
    render(<Harness />);

    expect(screen.getByRole("button", { name: "Advanced configuration" })).toBeInTheDocument();
  });

  it("surfaces step validation inline without toast (TB-2113)", async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("System name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-validation-error")).toHaveTextContent(
        REVIEW_START_STEP_VALIDATION_MESSAGE,
      );
    });

    expect(vi.mocked(showError)).not.toHaveBeenCalled();
  });
});
