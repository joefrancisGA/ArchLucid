import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import { createMinimalDemoPreviewPayload } from "../../see-it/see-it.fixtures";

const getShowcaseStaticDemoPayloadMock = vi.fn<(runId: string) => DemoCommitPagePreviewResponse>();

vi.mock("@/lib/showcase-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/showcase-static-demo")>();

  return {
    ...actual,
    getShowcaseStaticDemoPayload: (runId: string) => getShowcaseStaticDemoPayloadMock(runId),
  };
});

import MarketingShowcasePage from "./page";

describe("MarketingShowcasePage", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    getShowcaseStaticDemoPayloadMock.mockImplementation(() => createMinimalDemoPreviewPayload());
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not throw when the dynamic run id segment has malformed percent encoding", async () => {
    await expect(
      MarketingShowcasePage({ params: Promise.resolve({ runId: "%" }) }),
    ).resolves.toBeDefined();

    expect(getShowcaseStaticDemoPayloadMock).toHaveBeenCalledWith("%");
  });

  it("requests the marketing showcase API with a decoded run key", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    const encodedRunKey = "acme%20corp";
    const decodedRunKey = "acme corp";
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = decodedRunKey;

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await MarketingShowcasePage({
      params: Promise.resolve({ runId: encodedRunKey }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test/v1/marketing/showcase/${encodeURIComponent(decodedRunKey)}`,
      expect.objectContaining({ next: { revalidate: 300 } }),
    );
  });
});
