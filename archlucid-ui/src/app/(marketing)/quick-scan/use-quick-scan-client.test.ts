import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuickScanStatusResponse } from "@/lib/quick-scan/quick-scan-types";

const useQuickScanStatusQueryMock = vi.fn();

vi.mock("@/hooks/use-quick-scan-status-query", () => ({
  useQuickScanStatusQuery: () => useQuickScanStatusQueryMock(),
}));

vi.mock("@/lib/quick-scan/quick-scan-telemetry", () => ({
  trackQuickScanConversionClick: vi.fn(),
  trackQuickScanSampleViewed: vi.fn(),
}));

import { useQuickScanClient } from "@/app/(marketing)/quick-scan/use-quick-scan-client";

const REAL_ANALYSIS = {
  systemName: "Contoso",
  primaryEnvironment: "Azure",
  summary: "Real AI analysis result.",
};

const SAMPLE_ANALYSIS = {
  systemName: "Sample",
  primaryEnvironment: "Azure",
  summary: "Sample-only illustrative result.",
};

describe("useQuickScanClient", () => {
  beforeEach(() => {
    useQuickScanStatusQueryMock.mockReturnValue({ data: null });
  });

  it("does not auto-load sample when SampleOnly status arrives after a real analysis result exists", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(REAL_ANALYSIS),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_ANALYSIS,
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(() => useQuickScanClient());

    act(() => {
      result.current.setFormValues({
        systemName: "Contoso",
        primaryEnvironment: "Azure",
        primaryEnvironmentOther: "",
        description: "A multi-region workflow with audit logging.",
        architectureConcerns: [],
      });
      result.current.markFieldTouched("systemName");
      result.current.markFieldTouched("primaryEnvironment");
      result.current.markFieldTouched("description");
    });

    await act(async () => {
      await result.current.handleFormSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(REAL_ANALYSIS);
    });

    const sampleOnlyStatus: QuickScanStatusResponse = {
      enabled: true,
      capacityAvailable: false,
      requireSignIn: false,
      sampleResultAvailable: true,
      capacityState: "SampleOnly",
    };

    useQuickScanStatusQueryMock.mockReturnValue({ data: sampleOnlyStatus });
    rerender();

    await waitFor(() => {
      expect(result.current.status?.capacityState).toBe("SampleOnly");
    });

    expect(result.current.result).toEqual(REAL_ANALYSIS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
