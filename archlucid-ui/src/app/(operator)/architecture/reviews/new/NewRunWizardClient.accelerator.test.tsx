import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const acceleratorSearchParams = new URLSearchParams("accelerator=ai-llm-workload");

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => acceleratorSearchParams,
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
  createArchitectureRun: vi.fn(),
  getRunSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    hasMore: false,
  }),
}));

import { NewRunWizardClient } from "./NewRunWizardClient";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

describe("NewRunWizardClient (accelerator query)", { timeout: 60_000 }, () => {
  beforeEach(() => {
    window.localStorage.removeItem(WIZARD_MODE_STORAGE_KEY);

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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pre-fills the AI LLM accelerator pack and skips the preset step", async () => {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByLabelText("System name")).toBeInTheDocument();
    });

    const systemName = screen.getByLabelText("System name") as HTMLInputElement;

    expect(systemName.value).toBe("Enterprise.Copilot.RagPlatform");
    expect(screen.queryByTestId("wizard-preset-step")).not.toBeInTheDocument();
  });
});
