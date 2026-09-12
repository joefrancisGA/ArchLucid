/**
 * Mock-backed legibility ratchet for Inventory diagrams mermaid viewport (IDL-06).
 */
import { expect, test } from "@playwright/test";

import { MERMAID_MIN_LEGIBLE_LABEL_FONT_PX } from "@/lib/help/help-mermaid";

import {
  elevenVnetChainLegacyRenderResponse,
  elevenVnetPeerGridRenderResponse,
} from "./fixtures/infra-diagrams-mermaid";

const releaseGateTag = "@release-gate";
const snapshotId = "22222222-2222-2222-2222-222222222222";
const minNodeHeightPx = MERMAID_MIN_LEGIBLE_LABEL_FONT_PX * 1.6;

async function mockDiagramRoutes(
  page: import("@playwright/test").Page,
  renderResponse: ReturnType<typeof elevenVnetPeerGridRenderResponse>,
): Promise<void> {
  await page.route("**/api/proxy/v1/infra-evidence/snapshots**", async (route) => {
    const url = route.request().url();

    if (url.includes("/mermaid/preview")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          snapshotId,
          modes: [
            {
              mode: "executive",
              status: "Succeeded",
              nodeCount: renderResponse.metrics?.nodeCount ?? 0,
              edgeCount: renderResponse.metrics?.edgeCount ?? 0,
              mermaid: null,
              fallbackArtifacts: [],
            },
          ],
        }),
      });
      return;
    }

    if (url.includes("/mermaid")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(renderResponse),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            snapshotId,
            subscriptionName: "sub",
            capturedUtc: "2026-09-10T13:45:35Z",
            resourceCount: 889,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
      }),
    });
  });
}

test.describe(`infra-diagrams-layout (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.setTimeout(120_000);

  test("peer grid is legible, centered, and honest at default zoom", async ({ page }) => {
    await mockDiagramRoutes(page, elevenVnetPeerGridRenderResponse());

    await page.goto(
      `/governance/infrastructure/diagrams?snapshotId=${snapshotId}&mermaidMode=executive`,
      { waitUntil: "domcontentloaded" },
    );

    await page.waitForSelector('[data-testid="architecture-diagram-svg-host"] svg', { timeout: 120_000 });
    await page.waitForTimeout(1500);

    const metrics = await page.evaluate((minHeight) => {
      const viewport = document.querySelector('[data-testid="architecture-diagram-viewport"]');
      const svg = document.querySelector('[data-testid="architecture-diagram-svg-host"] svg');

      if (viewport === null || !(svg instanceof SVGSVGElement)) {
        return null;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const nodes = [...svg.querySelectorAll("g.node")].map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      });
      const sortedByRow = [...nodes].sort((left, right) => left.y - right.y || left.x - right.x);
      const rowTolerance = Math.max(8, (sortedByRow[0]?.h ?? 0) * 0.35);
      const firstRow = sortedByRow.filter((node) => Math.abs(node.y - (sortedByRow[0]?.y ?? 0)) <= rowTolerance);
      firstRow.sort((left, right) => left.x - right.x);
      const horizontalGaps: number[] = [];

      for (let index = 1; index < firstRow.length; index += 1) {
        horizontalGaps.push(firstRow[index]!.x - (firstRow[index - 1]!.x + firstRow[index - 1]!.w));
      }

      const minX = nodes.reduce((acc, node) => Math.min(acc, node.x), Number.POSITIVE_INFINITY);
      const maxX = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), Number.NEGATIVE_INFINITY);
      const minY = nodes.reduce((acc, node) => Math.min(acc, node.y), Number.POSITIVE_INFINITY);
      const maxY = nodes.reduce((acc, node) => Math.max(acc, node.y + node.h), Number.NEGATIVE_INFINITY);
      const viewBox = svg.getAttribute("viewBox");
      const viewBoxParts = (viewBox ?? "").trim().split(/[\s,]+/u).map((part) => Number.parseFloat(part));
      const viewBoxWidth = viewBoxParts.length === 4 ? viewBoxParts[2]! : Number.NaN;
      const viewBoxHeight = viewBoxParts.length === 4 ? viewBoxParts[3]! : Number.NaN;
      const zoomPercent = Number.parseInt(
        (document.querySelector('[data-testid="architecture-diagram-zoom-input"]') as HTMLInputElement | null)?.value ?? "100",
        10,
      );

      return {
        nodeCount: nodes.length,
        minNodeHeight: nodes.reduce((acc, node) => Math.min(acc, node.h), Number.POSITIVE_INFINITY),
        widthSpanRatio: (maxX - minX) / viewportRect.width,
        heightSpanRatio: (maxY - minY) / viewportRect.height,
        maxHorizontalGapRatio:
          horizontalGaps.length === 0
            ? 0
            : Math.max(...horizontalGaps) / Math.max(1, firstRow[0]?.w ?? 1),
        viewBoxWidthRatio: Number.isFinite(viewBoxWidth) ? viewBoxWidth / Math.max(1, svgRect.width) : Number.NaN,
        viewBoxHeightRatio: Number.isFinite(viewBoxHeight) ? viewBoxHeight / Math.max(1, svgRect.height) : Number.NaN,
        zoomPercent,
        allInsideSvg:
          nodes.every(
            (node) =>
              node.x >= svgRect.x
              && node.y >= svgRect.y
              && node.x + node.w <= svgRect.x + svgRect.width
              && node.y + node.h <= svgRect.y + svgRect.height,
          ),
        edgePathCount: svg.querySelectorAll("g.edgePaths path").length,
        outlineEdgeRows:
          Array.from(document.querySelectorAll("h3"))
            .find((heading) => heading.textContent?.trim() === "Edges")
            ?.parentElement?.querySelectorAll("tbody tr").length ?? 0,
        statusEdgeCount:
          document
            .querySelector('[data-testid="infra-diagrams-render-status-strip"]')
            ?.textContent?.match(/(\d+)\s+edges/u)?.[1] ?? null,
      };
    }, minNodeHeightPx);

    expect(metrics).not.toBeNull();
    expect(metrics?.nodeCount).toBe(11);
    expect(metrics?.minNodeHeight).toBeGreaterThanOrEqual(minNodeHeightPx);
    expect(metrics?.widthSpanRatio).toBeGreaterThanOrEqual(0.5);
    expect(metrics?.heightSpanRatio).toBeLessThanOrEqual(0.85);
    expect(metrics?.maxHorizontalGapRatio).toBeLessThanOrEqual(0.75);
    expect(metrics?.viewBoxWidthRatio).toBeLessThanOrEqual(1.25);
    expect(metrics?.viewBoxHeightRatio).toBeLessThanOrEqual(1.25);
    expect(metrics?.zoomPercent).toBeGreaterThanOrEqual(80);
    expect(metrics?.allInsideSvg).toBe(true);
    expect(metrics?.edgePathCount).toBe(0);
    expect(metrics?.outlineEdgeRows).toBe(0);
    expect(metrics?.statusEdgeCount).toBe("0");
  });

  test("legacy chain uses scroll instead of unreadable shrink at default zoom", async ({ page }) => {
    await mockDiagramRoutes(page, elevenVnetChainLegacyRenderResponse());

    await page.goto(
      `/governance/infrastructure/diagrams?snapshotId=${snapshotId}&mermaidMode=executive`,
      { waitUntil: "domcontentloaded" },
    );

    await page.waitForSelector('[data-testid="architecture-diagram-svg-host"] svg', { timeout: 120_000 });
    await page.waitForTimeout(1500);

    const metrics = await page.evaluate((minHeight) => {
      const viewport = document.querySelector('[data-testid="architecture-diagram-viewport"]');

      if (viewport === null) {
        return null;
      }

      const nodes = [...document.querySelectorAll("g.node")].map((node) => node.getBoundingClientRect().height);
      const minNodeHeight = nodes.reduce((acc, height) => Math.min(acc, height), Number.POSITIVE_INFINITY);

      return {
        minNodeHeight,
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
      };
    }, minNodeHeightPx);

    expect(metrics).not.toBeNull();
    expect(metrics?.minNodeHeight).toBeGreaterThanOrEqual(minNodeHeightPx);
    expect(metrics?.scrollHeight).toBeGreaterThan(metrics?.clientHeight ?? 0);
  });
});
