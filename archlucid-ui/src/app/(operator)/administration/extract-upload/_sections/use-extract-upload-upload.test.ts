import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useExtractUploadUpload } from "./use-extract-upload-upload";

const { invalidateQueries } = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));

vi.mock("@/lib/query/operator-query-client", () => ({
  getOperatorQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

function mockAcceptedReceipt(body: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, {
    status: 202,
    headers: { "X-Correlation-ID": "receipt-test" },
  })));
}

describe("useExtractUploadUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    invalidateQueries.mockClear();
  });

  it.each(['{"packageId":"  "}', '{}', 'invalid JSON'])(
    "reports an unconfirmed receipt without marking the upload accepted (%s)",
    async (body) => {
      mockAcceptedReceipt(body);
      const onUploadAccepted = vi.fn();
      const { result } = renderHook(() => useExtractUploadUpload({ onUploadAccepted }));

      await act(async () => {
        await expect(result.current.onUpload(new File(["zip"], "capture.zip"))).resolves.toBeNull();
      });

      expect(result.current.packageId).toBeNull();
      expect(result.current.uploadError).toMatchObject({
        message: expect.stringContaining("upload package ID"),
        correlationId: "receipt-test",
      });
      expect(onUploadAccepted).not.toHaveBeenCalled();
      expect(invalidateQueries).not.toHaveBeenCalled();
    },
  );

  it("preserves accepted receipt and snapshot identifiers for a valid response", async () => {
    mockAcceptedReceipt('{"packageId":" pkg-123 ","snapshotId":" snapshot-123 "}');
    const onUploadAccepted = vi.fn();
    const { result } = renderHook(() => useExtractUploadUpload({ onUploadAccepted }));
    const expected = { packageId: "pkg-123", snapshotId: "snapshot-123" };

    await act(async () => {
      await expect(result.current.onUpload(new File(["zip"], "capture.zip"))).resolves.toEqual(expected);
    });

    expect(result.current.packageId).toBe("pkg-123");
    expect(result.current.uploadError).toBeNull();
    expect(onUploadAccepted).toHaveBeenCalledWith(expected);
    expect(invalidateQueries).toHaveBeenCalledOnce();
  });
});
