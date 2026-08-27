import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent, ReactNode } from "react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useQuickScanClient } from "@/app/(marketing)/quick-scan/use-quick-scan-client";
import type { QuickScanResponse, QuickScanStatusResponse } from "@/lib/quick-scan/quick-scan-types";

let mockStatus: QuickScanStatusResponse | null = null;

vi.mock("@/hooks/use-quick-scan-status-query", () => ({
  useQuickScanStatusQuery: () => ({ data: mockStatus }),
}));

vi.mock("@/lib/quick-scan/quick-scan-telemetry", () => ({
  trackQuickScanConversionClick: vi.fn(),
  trackQuickScanSampleViewed: vi.fn(),
}));

const realAnalysis: QuickScanResponse = {
  scanId: "scan-real",
  systemName: "Claims intake API",
  primaryEnvironment: "Azure",
  summary: "Real analysis summary",
};

const sampleAnalysis: QuickScanResponse = {
  scanId: "scan-sample",
  systemName: "Sample system",
  primaryEnvironment: "Azure",
  summary: "Sample analysis summary",
  isSampleResult: true,
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useQuickScanClient", () => {
  beforeEach(() => {
    mockStatus = null;
    window.localStorage.clear();
  });

  it("does_not_overwrite_real_analysis_when_sample_only_status_loads_after_submit", async () => {
    const sampleOnlyStatus: QuickScanStatusResponse = {
      enabled: false,
      capacityAvailable: false,
      requireSignIn: false,
      sampleResultAvailable: true,
      capacityState: "SampleOnly",
    };

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/proxy/v1/marketing/quick-scan/sample")) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleAnalysis,
        });
      }

      if (url.includes("/api/proxy/v1/marketing/quick-scan") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify(realAnalysis),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(() => useQuickScanClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.loadExample();
    });

    await act(async () => {
      await result.current.handleFormSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(result.current.result?.scanId).toBe("scan-real");
    });

    mockStatus = sampleOnlyStatus;
    rerender();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.result?.scanId).toBe("scan-real");
    expect(result.current.result?.summary).toBe("Real analysis summary");

    const sampleCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/api/proxy/v1/marketing/quick-scan/sample"),
    );

    expect(sampleCalls).toHaveLength(0);
  });
});
