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

      const minX = nodes.reduce((acc, node) => Math.min(acc, node.x), Number.POSITIVE_INFINITY);
      const maxX = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), Number.NEGATIVE_INFINITY);

      return {
        nodeCount: nodes.length,
        minNodeHeight: nodes.reduce((acc, node) => Math.min(acc, node.h), Number.POSITIVE_INFINITY),
        widthSpanRatio: (maxX - minX) / viewportRect.width,
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
      };
    }, minNodeHeightPx);

    expect(metrics).not.toBeNull();
    expect(metrics?.nodeCount).toBe(11);
    expect(metrics?.minNodeHeight).toBeGreaterThanOrEqual(minNodeHeightPx);
    expect(metrics?.widthSpanRatio).toBeGreaterThanOrEqual(0.5);
    expect(metrics?.allInsideSvg).toBe(true);
    expect(metrics?.edgePathCount).toBe(0);
    expect(metrics?.outlineEdgeRows).toBe(0);
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
