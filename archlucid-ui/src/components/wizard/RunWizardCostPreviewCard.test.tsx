import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RunWizardCostPreviewCard } from "./RunWizardCostPreviewCard";

const simulatorPayload = {
  mode: "Simulator",
  maxCompletionTokens: 4096,
  estimatedCostUsd: null,
  estimatedCostUsdLow: null,
  estimatedCostUsdHigh: null,
  estimatedCostBasis:
    "Starter run = 4 parallel agents (Topology, Cost, Compliance, Critic). Low = one completion at 8192 assumed input tokens.",
  pricingUsesIllustrativeUsdRates: true,
  deploymentName: null,
};

describe("RunWizardCostPreviewCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when host mode is Simulator", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => simulatorPayload,
      })),
    );

    const { container } = render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.queryByTestId("run-cost-preview-loading")).not.toBeInTheDocument();
    });

    expect(container.querySelector('[data-testid="run-cost-preview-card"]')).toBeNull();
  });

  it("labels omitted execution mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ...simulatorPayload,
          mode: null,
        }),
      })),
    );

    render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-cost-preview-mode-omitted")).toHaveTextContent(
        "Execution mode was not stored.",
      );
    });
  });

  it("shows USD band and max tokens when mode is Real", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          mode: "Real",
          maxCompletionTokens: 1024,
          estimatedCostUsd: 0.7168,
          estimatedCostUsdLow: 0.03584,
          estimatedCostUsdHigh: 0.7168,
          estimatedCostBasis: "Starter run = 4 parallel agents.",
          pricingUsesIllustrativeUsdRates: true,
          deploymentName: "gpt-test",
        }),
      })),
    );

    render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-cost-preview-card")).toBeInTheDocument();
    });

    expect(screen.getByTestId("run-cost-preview-amount")).toHaveTextContent("$0.04");
    expect(screen.getByTestId("run-cost-preview-amount")).toHaveTextContent("$0.72");
    expect(screen.getByTestId("run-cost-preview-headline")).toHaveTextContent("MaxCompletionTokens");
    expect(screen.getByTestId("run-cost-preview-headline")).toHaveTextContent("=1024");
    expect(screen.getByTestId("run-cost-preview-headline")).toHaveTextContent("gpt-test");
    expect(screen.getByText(/Illustrative USD rates are still set from defaults/i)).toBeInTheDocument();
  });

  it("labels missing estimated cost without an em dash placeholder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          mode: "Real",
          maxCompletionTokens: 1024,
          estimatedCostUsd: null,
          estimatedCostUsdLow: null,
          estimatedCostUsdHigh: null,
          estimatedCostBasis: "",
          pricingUsesIllustrativeUsdRates: false,
          deploymentName: "gpt-test",
        }),
      })),
    );

    render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-cost-preview-amount")).toHaveTextContent("Estimated cost was not stored.");
    });

    expect(screen.getByTestId("run-cost-preview-headline").textContent).not.toMatch(/band:/i);
  });

  it("shows load failure copy when preview request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
      })),
    );

    render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-cost-preview-error")).toHaveTextContent("Cost preview was not loaded.");
    });
  });

  it("omits Azure OpenAI from headline when deployment name was not stored (P-20)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          mode: "Real",
          maxCompletionTokens: 1024,
          estimatedCostUsd: 0.1,
          estimatedCostUsdLow: 0.05,
          estimatedCostUsdHigh: 0.1,
          estimatedCostBasis: "Starter run = 4 parallel agents.",
          pricingUsesIllustrativeUsdRates: false,
          deploymentName: null,
        }),
      })),
    );

    render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-cost-preview-headline")).toHaveTextContent(
        "Estimated agent execution cost for this review:",
      );
    });

    expect(screen.getByTestId("run-cost-preview-headline").textContent).not.toContain("Azure OpenAI");
  });

  it("labels stored-empty deployment name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          mode: "Real",
          maxCompletionTokens: 1024,
          estimatedCostUsd: 0.1,
          estimatedCostUsdLow: 0.05,
          estimatedCostUsdHigh: 0.1,
          estimatedCostBasis: "Starter run = 4 parallel agents.",
          pricingUsesIllustrativeUsdRates: false,
          deploymentName: "",
        }),
      })),
    );

    render(<RunWizardCostPreviewCard previewUrl="/api/proxy/v1/agent-execution/cost-preview" />);

    await waitFor(() => {
      expect(screen.getByTestId("run-cost-preview-deployment-stored-empty")).toHaveTextContent(
        "Deployment name was stored empty.",
      );
    });
    expect(screen.getByRole("link", { name: /PER_TENANT_COST_MODEL/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/\/help\/|PER_TENANT_COST_MODEL/),
    );
  });
});
