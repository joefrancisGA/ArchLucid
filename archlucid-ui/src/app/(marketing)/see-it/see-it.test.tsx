import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import {
  CANONICAL_ANONYMOUS_PROOF_HREF,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import { loadSeeItDemoPreview } from "./load-see-it-demo-preview";
import { createMinimalDemoPreviewPayload } from "./see-it.fixtures";
import { resolveSeeItDemoUniverse, seeItUniverseBannerTitle } from "./see-it-demo-universe";
import { SeeItDeliverablePreview } from "./SeeItDeliverablePreview";
import { SeeItMarketingBody } from "./SeeItMarketingBody";

describe("loadSeeItDemoPreview", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns live payload when fetch returns Claims-universe 200 JSON (M-107 Option A)", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_API_BASE", "https://demo-api.test");

    const livePayload = createMinimalDemoPreviewPayload();
    livePayload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    livePayload.run.description = "Claims Intake Modernization Review";
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(livePayload), {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: '"fixture-etag"' },
      }),
    );

    const result = await loadSeeItDemoPreview({
      fetchFn,
      readSnapshotFile: () => {
        throw new Error("snapshot must not be read on Claims live success path");
      },
    });

    expect(result.source).toBe("live");
    expect(result.etag).toBe('"fixture-etag"');
    expect(result.payload.run.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
    expect(fetchFn).toHaveBeenCalledWith(
      "https://demo-api.test/v1/demo/preview",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("falls back to Claims snapshot when live payload is Contoso (M-107 Option A)", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_API_BASE", "https://demo-api.test");

    const livePayload = createMinimalDemoPreviewPayload();
    livePayload.run.runId = "6e8c4a102b1f4c9a9d3e10b2a4f0c501";
    livePayload.run.description = "Contoso Retail modernization — migrate monolith checkout.";

    const snapshotPayload = createMinimalDemoPreviewPayload();
    snapshotPayload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    snapshotPayload.run.description = "Claims Intake Modernization Review";

    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(livePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await loadSeeItDemoPreview({
      fetchFn,
      readSnapshotFile: () => snapshotPayload,
    });

    expect(result.source).toBe("snapshot");
    expect(result.payload.run.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
  });

  it("falls back to Claims snapshot when live payload universe is unknown (M-107 Option A)", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_API_BASE", "https://demo-api.test");

    const livePayload = createMinimalDemoPreviewPayload();
    const snapshotPayload = createMinimalDemoPreviewPayload();
    snapshotPayload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;

    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(livePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await loadSeeItDemoPreview({
      fetchFn,
      readSnapshotFile: () => snapshotPayload,
    });

    expect(result.source).toBe("snapshot");
    expect(result.payload.run.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
  });

  it("returns snapshot payload when fetch throws", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_API_BASE", "https://demo-api.test");

    const snapshotPayload = createMinimalDemoPreviewPayload();
    snapshotPayload.run.runId = "00000000000000000000000000000000";

    const fetchFn = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await loadSeeItDemoPreview({
      fetchFn,
      readSnapshotFile: () => snapshotPayload,
    });

    expect(result.source).toBe("snapshot");
    expect(result.payload.run.runId).toBe("00000000000000000000000000000000");
  });

  it("returns snapshot when response is 304 Not Modified", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_API_BASE", "https://demo-api.test");

    const snapshotPayload = createMinimalDemoPreviewPayload();
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 304 }));

    const result = await loadSeeItDemoPreview({
      fetchFn,
      readSnapshotFile: () => snapshotPayload,
    });

    expect(result.source).toBe("snapshot");
    expect(result.payload).toBe(snapshotPayload);
  });

  it("returns snapshot when response is 500", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_API_BASE", "https://demo-api.test");

    const snapshotPayload = createMinimalDemoPreviewPayload();
    const fetchFn = vi.fn().mockResolvedValue(new Response("", { status: 500 }));

    const result = await loadSeeItDemoPreview({
      fetchFn,
      readSnapshotFile: () => snapshotPayload,
    });

    expect(result.source).toBe("snapshot");
    expect(result.payload).toBe(snapshotPayload);
  });
});

describe("resolveSeeItDemoUniverse", () => {
  it("classifies Claims showcase run id as claims", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    payload.run.description = "Claims Intake Modernization Review";

    expect(resolveSeeItDemoUniverse(payload)).toBe("claims");
    expect(seeItUniverseBannerTitle("claims")).toContain("Healthcare claims");
  });

  it("classifies Contoso Retail demo run id as contoso", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = "6e8c4a102b1f4c9a9d3e10b2a4f0c501";
    payload.run.description = "Contoso Retail modernization — migrate monolith checkout.";

    expect(resolveSeeItDemoUniverse(payload)).toBe("contoso");
  });

  it("fails closed to unknown when Claims and Contoso signals collide", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    payload.run.description = "Contoso Retail claims intake hybrid";

    expect(resolveSeeItDemoUniverse(payload)).toBe("unknown");
  });
});

describe("SeeItMarketingBody", () => {
  it("renders live mode without snapshot notice and fails closed when universe is unknown", () => {
    const payload = createMinimalDemoPreviewPayload();

    render(<SeeItMarketingBody source="live" payload={payload} />);

    expect(screen.getByTestId("see-it-demo-banner")).toHaveAttribute("data-see-it-universe", "unknown");
    expect(screen.getByTestId("see-it-demo-banner-title")).toHaveTextContent("Public sample preview");
    expect(screen.getByTestId("see-it-demo-banner-title")).not.toHaveTextContent(/Healthcare claims/i);
    expect(screen.queryByTestId("see-it-snapshot-notice")).toBeNull();
    expect(screen.getByTestId("see-it-finding-counts")).toHaveTextContent("7");
    expect(screen.getByTestId("see-it-finding-counts")).toHaveTextContent("findings");
    expect(screen.getByTestId("see-it-finding-counts")).toHaveTextContent("2 monitored risks");
    expect(screen.getByTestId("see-it-summary-status")).toHaveTextContent(/Approved/i);
    expect(screen.getByTestId("marketing-proof-chain-strip")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-proof-chain-pipeline")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-proof-pack-download")).toHaveAttribute(
      "href",
      "/api/proxy/v1/marketing/why-archlucid-pack.pdf",
    );
    expect(screen.getByTestId("see-it-proof-pack-download")).toHaveTextContent(/sample overview/i);
  });

  it("never shows Claims banner chrome over a Contoso payload (TB-1279)", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = "6e8c4a102b1f4c9a9d3e10b2a4f0c502";
    payload.run.description = "Contoso Retail modernization — migrate monolith checkout to Azure.";

    render(<SeeItMarketingBody source="live" payload={payload} />);

    expect(screen.getByTestId("see-it-demo-banner")).toHaveAttribute("data-see-it-universe", "contoso");
    expect(screen.getByTestId("see-it-demo-banner-title")).toHaveTextContent(
      "Retail baseline sample — public evaluation preview",
    );
    expect(screen.getByTestId("see-it-demo-banner-title")).not.toHaveTextContent(/Healthcare claims/i);
  });

  it("shows Claims banner only when payload is Claims universe", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    payload.run.description = "Claims Intake Modernization Review";

    render(<SeeItMarketingBody source="live" payload={payload} />);

    expect(screen.getByTestId("see-it-demo-banner")).toHaveAttribute("data-see-it-universe", "claims");
    expect(screen.getByTestId("see-it-demo-banner-title")).toHaveTextContent(
      "Healthcare claims sample — public evaluation preview",
    );
  });

  it("renders snapshot mode with snapshot notice", () => {
    const payload = createMinimalDemoPreviewPayload();

    render(<SeeItMarketingBody source="snapshot" payload={payload} />);

    expect(screen.getByTestId("see-it-snapshot-notice")).toBeInTheDocument();
  });

  /** Snapshot JSON or malformed API payloads may omit `artifacts`; avoid `.slice` on undefined (SSR stringify). */
  it("renders without crashing when artifacts is missing", () => {
    const payload = createMinimalDemoPreviewPayload();
    const malformed = { ...payload, artifacts: undefined } as unknown as DemoCommitPagePreviewResponse;

    render(<SeeItMarketingBody source="snapshot" payload={malformed} />);

    expect(screen.getByTestId("see-it-no-artifacts")).toBeInTheDocument();
    expect(screen.getByText(/Executive sponsor briefing/i)).toBeInTheDocument();
  });

  it("normalizes the secondary CTA row to a single PDF outline action (TB-1282)", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    payload.run.description = "Claims Intake Modernization Review";

    render(<SeeItMarketingBody source="live" payload={payload} />);

    const pdf = screen.getByTestId("see-it-proof-pack-download");

    expect(pdf).toHaveAttribute("href", "/api/proxy/v1/marketing/why-archlucid-pack.pdf");
    expect(pdf.tagName).toBe("A");
    expect(screen.getByTestId("see-it-secondary-cta-row").querySelectorAll("a")).toHaveLength(1);
    expect(screen.queryByTestId("see-it-full-preview-link")).toBeNull();
  });

  it("never deep-links Contoso /demo/preview from Claims /see-it (TB-1028 Option A)", () => {
    const payload = createMinimalDemoPreviewPayload();
    payload.run.runId = SHOWCASE_STATIC_DEMO_RUN_ID;
    payload.run.description = "Claims Intake Modernization Review";

    const { container } = render(<SeeItMarketingBody source="live" payload={payload} />);

    expect(screen.queryByTestId("see-it-cta-demo-preview")).toBeNull();
    expect(container.querySelector('a[href="/demo/preview"]')).toBeNull();
    expect(screen.queryByTestId("see-it-full-preview-link")).toBeNull();
  });
});

describe("SeeItDeliverablePreview", () => {
  it("links the visual proof stack to the Claims showcase", () => {
    render(<SeeItDeliverablePreview />);

    expect(screen.getByTestId("see-it-deliverable-preview")).toHaveAttribute(
      "href",
      CANONICAL_ANONYMOUS_PROOF_HREF,
    );
    expect(screen.getByText(/Executive summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit trail/i)).toBeInTheDocument();
  });
});
