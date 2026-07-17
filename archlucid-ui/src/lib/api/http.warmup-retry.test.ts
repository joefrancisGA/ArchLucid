import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastMocks = vi.hoisted(() => ({
  showApiRequestErrorToast: vi.fn(),
}));

vi.mock("@/lib/api-error-toast", () => toastMocks);

import { apiGet } from "@/lib/api/http";

describe("http warmup retry (TB-757)", () => {
  const fetchMock = vi.fn();
  let originalWindow: (Window & typeof globalThis) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "http://localhost:5128");
    originalWindow = globalThis.window;
    // Force server-side direct API path (not browser proxy).
    // @ts-expect-error jsdom always defines window; delete for this suite only.
    delete globalThis.window;
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    toastMocks.showApiRequestErrorToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
  });

  it("retries direct server GET on brief 502 before throwing", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("upstream warming", { status: 502 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

    const pending = apiGet<{ ok: boolean }>("/v1/version");
    await vi.runAllTimersAsync();
    const data = await pending;

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toastMocks.showApiRequestErrorToast).not.toHaveBeenCalled();
  });

  it("exhausts server GET warmup retries before failing without browser toast", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response("still down", { status: 502 })));

    const pending = apiGet("/v1/version");
    const rejection = expect(pending).rejects.toMatchObject({ httpStatus: 502 });
    await vi.runAllTimersAsync();
    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(toastMocks.showApiRequestErrorToast).not.toHaveBeenCalled();
  });
});
