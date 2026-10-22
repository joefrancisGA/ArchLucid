import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsState = {
  value: new URLSearchParams("preset=greenfield"),
};

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => {
      const query = window.location.search.startsWith("?")
        ? window.location.search.slice(1)
        : window.location.search;

      return new URLSearchParams(query);
    },
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
    usePathname: () => "/architecture/reviews/new",
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
import {
  NEW_RUN_WIZARD_SYSTEM_NAME_LABEL,
  prepareNewRunWizardVitestHarness,
} from "./new-run-wizard-test-helpers";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

describe("NewRunWizardClient (preset deeplink query)", { timeout: 60_000 }, () => {
  beforeEach(() => {
    prepareNewRunWizardVitestHarness();
    searchParamsState.value = new URLSearchParams("preset=greenfield");
    window.history.replaceState(null, "", `/architecture/reviews/new?${searchParamsState.value.toString()}`);
    window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "full");

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

  it("applies the greenfield preset and skips the preset selection step", async () => {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("wizard-preset-deeplink-active")).toHaveAttribute(
        "data-preset-id",
        "greenfield-web-app",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByLabelText(NEW_RUN_WIZARD_SYSTEM_NAME_LABEL)).toBeInTheDocument();
    });

    const systemName = screen.getByLabelText(NEW_RUN_WIZARD_SYSTEM_NAME_LABEL) as HTMLInputElement;
    expect(systemName.value).toBe("CustomerWebApp");
    expect(screen.queryByTestId("new-run-wizard-step-line")).not.toHaveTextContent("Choose starting point");
  });

  it("does not auto-select when the preset token is missing or unknown", async () => {
    searchParamsState.value = new URLSearchParams("preset=legacy");
    window.history.replaceState(null, "", `/architecture/reviews/new?${searchParamsState.value.toString()}`);
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-step-line")).toHaveTextContent("Choose starting point");
    });

    expect(screen.queryByTestId("wizard-preset-deeplink-active")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use greenfield web app/i })).toBeInTheDocument();
  });
});
