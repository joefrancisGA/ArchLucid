import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import { createMinimalDemoPreviewPayload } from "../../see-it/see-it.fixtures";
import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

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
import * as showcasePageResolution from "@/lib/showcase-page-resolution";

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

  it("shows not-available instead of static demo when API is unreachable for a non-curated run id", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    fetchMock.mockRejectedValue(new Error("network down"));

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

  it("serves static-first curated slugs with static render mode even when API base is configured", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    const page = await MarketingShowcasePage({
      params: Promise.resolve({ runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID }),
    });

    render(page);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("showcase-static-demo-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("showcase-api-unavailable-banner")).not.toBeInTheDocument();
  });

  it("hard-fails non-curated slugs when API returns unreadable JSON", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    fetchMock.mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const page = await MarketingShowcasePage({
      params: Promise.resolve({ runId: "acme-corp-unknown" }),
    });

    render(page);

    expect(screen.getByText("This showcase could not be loaded right now. Please try again later.")).toBeInTheDocument();
    expect(getShowcaseStaticDemoPayloadMock).not.toHaveBeenCalled();
  });

  it("falls back to curated static payload when API returns unreadable JSON for a curated slug", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");
    vi.spyOn(showcasePageResolution, "hasCuratedShowcaseStaticPayload").mockReturnValue(true);

    fetchMock.mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const page = await MarketingShowcasePage({
      params: Promise.resolve({ runId: "claims-intake-modernization" }),
    });

    render(page);

    expect(screen.getByTestId("showcase-api-unavailable-banner")).toBeInTheDocument();
    expect(getShowcaseStaticDemoPayloadMock).toHaveBeenCalledWith("claims-intake-modernization");
  });

  it("treats API payloads missing manifestId as invalid", async () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://api.test");

    const payload = createMinimalDemoPreviewPayload();
    const missingManifestIdPayload = {
      ...payload,
      manifest: {
        ...payload.manifest,
        manifestId: "",
      },
    };

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(missingManifestIdPayload), {
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
});
