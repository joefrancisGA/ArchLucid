import { zodResolver } from "@hookform/resolvers/zod";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";

import { buildDefaultWizardValues, wizardFormSchema, type WizardFormValues } from "@/lib/wizard-schema";

const createRun = vi.fn();

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createRun(...args),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SimplifiedPilotWizard } from "./SimplifiedPilotWizard";

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
  it("walks three steps, prefills from ZIP, and submits createArchitectureRun", async () => {
    createRun.mockResolvedValue({ run: { runId: "pilot-run-1" } });

    render(<Harness />);

    expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 1 of 3/i);
    expect(screen.getByTestId("wizard-baseline-zip-field")).toBeInTheDocument();

    const zipInput = within(screen.getByTestId("wizard-baseline-zip-field")).getByLabelText("Azure packager ZIP");
    const zipFile = makeArchLucidPackageZip();

    await act(async () => {
      fireEvent.change(zipInput, { target: { files: [zipFile] } });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("wizard-azure-zip-error")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 2 of 3/i);
    });

    const systemName = screen.getByLabelText("System name") as HTMLInputElement;
    expect(systemName.value).toBe("MyRg");

    const description = screen.getByLabelText("Description") as HTMLTextAreaElement;

    if (description.value.trim().length < 10) {
      fireEvent.change(description, {
        target: {
          value:
            "Ten char min: assess the Azure inventory captured in the extractor ZIP for this pilot architecture review.",
        },
      });
    }

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 3 of 3/i);
    });

    fireEvent.click(screen.getByRole("button", { name: "Start Architecture Review" }));

    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });
  });

  it("exposes advanced configuration behind an accordion on step 2", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("simplified-pilot-progress")).toHaveTextContent(/step 2 of 3/i);
    });

    expect(screen.getByRole("button", { name: "Advanced configuration" })).toBeInTheDocument();
  });
});
