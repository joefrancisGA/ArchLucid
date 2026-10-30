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

import { trackQuickScanSampleViewed } from "@/lib/quick-scan/quick-scan-telemetry";

vi.mock("@/lib/auth/turnstile-config", () => ({
  isTurnstileBotChallengeConfigured: vi.fn(() => false),
  readTurnstileSiteKey: vi.fn(() => null),
}));

import { useQuickScanClient } from "@/app/(marketing)/quick-scan/use-quick-scan-client";
import { isTurnstileBotChallengeConfigured } from "@/lib/auth/turnstile-config";

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
    vi.mocked(isTurnstileBotChallengeConfigured).mockReturnValue(false);
  });

  it("clears stale capacity banner when status recovers to Available", async () => {
    const busyStatus: QuickScanStatusResponse = {
      enabled: true,
      capacityAvailable: false,
      requireSignIn: false,
      sampleResultAvailable: true,
      capacityState: "Busy",
    };

    useQuickScanStatusQueryMock.mockReturnValue({ data: busyStatus });

    const { result, rerender } = renderHook(() => useQuickScanClient());

    await waitFor(() => {
      expect(result.current.capacityMessage).toBe(
        "Quick Scan is busy right now. View the sample result or try again in a moment.",
      );
    });

    const availableStatus: QuickScanStatusResponse = {
      enabled: true,
      capacityAvailable: true,
      requireSignIn: false,
      sampleResultAvailable: true,
      capacityState: "Available",
    };

    useQuickScanStatusQueryMock.mockReturnValue({ data: availableStatus });
    rerender();

    await waitFor(() => {
      expect(result.current.capacityMessage).toBeNull();
      expect(result.current.aiSubmitBlocked).toBe(false);
    });
  });

  it("requires captcha challenge and sends botChallengeToken after QUICK_SCAN_CAPTCHA_REQUIRED", async () => {
    vi.mocked(isTurnstileBotChallengeConfigured).mockReturnValue(true);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () =>
          JSON.stringify({
            detail: "Complete the security check to continue with Quick Scan.",
            extensions: { errorCode: "QUICK_SCAN_CAPTCHA_REQUIRED" },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(REAL_ANALYSIS),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useQuickScanClient());

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
      expect(result.current.captchaChallengeRequired).toBe(true);
      expect(result.current.canSubmit).toBe(false);
    });

    act(() => {
      result.current.handleBotChallengeTokenChange("turnstile-token");
    });

    await waitFor(() => {
      expect(result.current.canSubmit).toBe(true);
    });

    await act(async () => {
      await result.current.handleFormSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(REAL_ANALYSIS);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(secondRequest.body))).toMatchObject({
      botChallengeToken: "turnstile-token",
    });
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

  it("ignores stale sample responses when a newer sample request was started", async () => {
    let resolveFirst: ((value: Response) => void) | undefined;
    const firstSamplePromise = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const sourceState = new URL(url, "http://localhost").searchParams.get("sourceState");

      if (sourceState === "Busy") {
        return firstSamplePromise;
      }

      return Promise.resolve({
        ok: true,
        json: async () => SAMPLE_ANALYSIS,
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useQuickScanClient());

    act(() => {
      result.current.showSampleResult("Busy");
      result.current.showSampleResult("SampleOnly");
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(SAMPLE_ANALYSIS);
    });

    await act(async () => {
      resolveFirst?.({
        ok: true,
        json: async () => ({
          systemName: "Stale",
          primaryEnvironment: "Azure",
          summary: "Should not replace the newer sample.",
        }),
      } as Response);
    });

    expect(result.current.result).toEqual(SAMPLE_ANALYSIS);
  });

  it("records sample viewed telemetry once when showSampleResult is invoked twice before the first fetch settles", async () => {
    let resolveSample: ((value: Response) => void) | undefined;
    const samplePromise = new Promise<Response>((resolve) => {
      resolveSample = resolve;
    });

    vi.mocked(trackQuickScanSampleViewed).mockClear();

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/marketing/quick-scan/sample")) {
        return samplePromise;
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useQuickScanClient());

    act(() => {
      result.current.showSampleResult("SampleOnly");
      result.current.showSampleResult("SampleOnly");
    });

    await act(async () => {
      resolveSample?.({
        ok: true,
        json: async () => SAMPLE_ANALYSIS,
      } as Response);
    });

    await waitFor(() => {
      expect(result.current.result).toEqual(SAMPLE_ANALYSIS);
    });

    expect(trackQuickScanSampleViewed).toHaveBeenCalledTimes(1);
    expect(trackQuickScanSampleViewed).toHaveBeenCalledWith("SampleOnly");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not let a stale sample response overwrite a completed AI analysis", async () => {
    let resolveSample: ((value: Response) => void) | undefined;
    const samplePromise = new Promise<Response>((resolve) => {
      resolveSample = resolve;
    });

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/marketing/quick-scan/sample")) {
        return samplePromise;
      }

      if (url.includes("/marketing/quick-scan") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify(REAL_ANALYSIS),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useQuickScanClient());

    act(() => {
      result.current.showSampleResult("Busy");
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

    await act(async () => {
      resolveSample?.({
        ok: true,
        json: async () => SAMPLE_ANALYSIS,
      } as Response);
    });

    expect(result.current.result).toEqual(REAL_ANALYSIS);
  });
});
