import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
import { generateMetadata } from "./page";

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

  it("generateMetadata does not throw when run id has malformed percent encoding", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ runId: "%" }) }),
    ).resolves.toMatchObject({
      title: expect.stringContaining("Completed example (%)"),
    });
  });

  it("shows not-available shell for non-curated run ids when the marketing API returns 503", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    fetchMock.mockResolvedValue(new Response("upstream unavailable", { status: 503 }));

    const page = await MarketingShowcasePage({
      params: Promise.resolve({ runId: "acme-corp" }),
    });

    render(page);

    expect(screen.getByTestId("demo-preview-not-available")).toBeInTheDocument();
    expect(getShowcaseStaticDemoPayloadMock).not.toHaveBeenCalled();
  });

  it("treats API payloads missing artifact arrays as invalid", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    const payload = createMinimalDemoPreviewPayload();
    const thinPayload = {
      run: payload.run,
      manifest: payload.manifest,
    };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(thinPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const page = await MarketingShowcasePage({
      params: Promise.resolve({ runId: "acme-corp" }),
    });

    render(page);

    expect(screen.getByTestId("demo-preview-not-available")).toBeInTheDocument();
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
