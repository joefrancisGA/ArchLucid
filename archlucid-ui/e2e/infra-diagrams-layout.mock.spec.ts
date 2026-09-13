/**
 * Mock-backed legibility ratchet for Inventory diagrams mermaid viewport (IDL-06, IDH-03).
 */
import { expect, test } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

import { MERMAID_MIN_LEGIBLE_LABEL_FONT_PX } from "@/lib/help/help-mermaid";

import {
  elevenVnetChainLegacyRenderResponse,
  elevenVnetPeerGridRenderResponse,
  elevenVnetSparsePeeringRenderResponse,
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
      const camera = document.querySelector('[data-testid="architecture-diagram-camera"]');
      const controls = document.querySelector('[data-testid="architecture-diagram-viewport-controls"]');
      const svg = document.querySelector('[data-testid="architecture-diagram-svg-host"] svg');

      if (viewport === null || camera === null || controls === null || !(svg instanceof SVGSVGElement)) {
        return null;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
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
        chrome: {
          cameraIsDescendant: viewport.contains(camera),
          controlsOutsideCamera: !camera.contains(controls),
          controlsVisibleInFrame:
            controlsRect.right <= viewportRect.right + 1
            && controlsRect.left >= viewportRect.left - 1
            && controlsRect.top >= viewportRect.top - 1
            && controlsRect.bottom <= viewportRect.bottom + 1,
        },
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
    expect(metrics?.chrome?.cameraIsDescendant).toBe(true);
    expect(metrics?.chrome?.controlsOutsideCamera).toBe(true);
    expect(metrics?.chrome?.controlsVisibleInFrame).toBe(true);
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
      const camera = document.querySelector('[data-testid="architecture-diagram-camera"]');

      if (camera === null) {
        return null;
      }

      const nodes = [...document.querySelectorAll("g.node")].map((node) => node.getBoundingClientRect().height);
      const minNodeHeight = nodes.reduce((acc, height) => Math.min(acc, height), Number.POSITIVE_INFINITY);

      return {
        minNodeHeight,
        scrollHeight: camera.scrollHeight,
        clientHeight: camera.clientHeight,
      };
    }, minNodeHeightPx);

    expect(metrics).not.toBeNull();
    expect(metrics?.minNodeHeight).toBeGreaterThanOrEqual(minNodeHeightPx);
    expect(metrics?.scrollHeight).toBeGreaterThan(metrics?.clientHeight ?? 0);
  });

  test("owner peering forest is a compact TD grid at 100 percent zoom", async ({ page }, testInfo: TestInfo) => {
    await page.setViewportSize({ width: 1440, height: 1400 });
    await mockDiagramRoutes(page, elevenVnetSparsePeeringRenderResponse());

    await page.goto(
      `/governance/infrastructure/diagrams?snapshotId=${snapshotId}&mermaidMode=executive`,
      { waitUntil: "domcontentloaded" },
    );

    await page.waitForSelector('[data-testid="architecture-diagram-svg-host"] svg', { timeout: 120_000 });
    await page.waitForTimeout(1500);

    const metrics = await page.evaluate((minHeight) => {
      const viewport = document.querySelector('[data-testid="architecture-diagram-viewport"]');
      const camera = document.querySelector('[data-testid="architecture-diagram-camera"]');
      const svg = document.querySelector('[data-testid="architecture-diagram-svg-host"] svg');

      if (viewport === null || camera === null || !(svg instanceof SVGSVGElement)) {
        return null;
      }

      const mapLocalBBox = (element: SVGGraphicsElement): { x: number; y: number; w: number; h: number } | null => {
        const local = element.getBBox();
        const elementScreenCtm = element.getScreenCTM();
        const svgScreenCtm = svg.getScreenCTM();

        if (elementScreenCtm === null || svgScreenCtm === null) {
          return null;
        }

        const toSvg = svgScreenCtm.inverse().multiply(elementScreenCtm);
        const corners: Array<readonly [number, number]> = [
          [local.x, local.y],
          [local.x + local.width, local.y],
          [local.x, local.y + local.height],
          [local.x + local.width, local.y + local.height],
        ];
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const [x, y] of corners) {
          const point = svg.createSVGPoint();
          point.x = x;
          point.y = y;
          const mapped = point.matrixTransform(toSvg);
          minX = Math.min(minX, mapped.x);
          minY = Math.min(minY, mapped.y);
          maxX = Math.max(maxX, mapped.x);
          maxY = Math.max(maxY, mapped.y);
        }

        if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) {
          return null;
        }

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      };

      const viewportRect = viewport.getBoundingClientRect();
      const nodeElements = [...svg.querySelectorAll("g.node")];
      const nodeRects = nodeElements.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      });
      const visibleNodeCount = nodeRects.filter((node) => {
        const intersectionW = Math.max(
          0,
          Math.min(node.x + node.w, viewportRect.right) - Math.max(node.x, viewportRect.left),
        );
        const intersectionH = Math.max(
          0,
          Math.min(node.y + node.h, viewportRect.bottom) - Math.max(node.y, viewportRect.top),
        );
        const intersectionArea = intersectionW * intersectionH;
        const nodeArea = node.w * node.h;

        return nodeArea > 0 && intersectionArea / nodeArea >= 0.5;
      }).length;

      const mappedBoxes = nodeElements.flatMap((node) => {
        if (!(node instanceof SVGGraphicsElement)) {
          return [];
        }

        const mapped = mapLocalBBox(node);

        return mapped === null ? [] : [mapped];
      });
      const union = mappedBoxes.reduce(
        (acc, box) => ({
          minX: Math.min(acc.minX, box.x),
          minY: Math.min(acc.minY, box.y),
          maxX: Math.max(acc.maxX, box.x + box.w),
          maxY: Math.max(acc.maxY, box.y + box.h),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );
      const mappedUnionWidth = union.maxX - union.minX;
      const mappedUnionHeight = union.maxY - union.minY;
      const viewBoxParts = (svg.getAttribute("viewBox") ?? "0 0 0 0").trim().split(/[\s,]+/u).map(Number.parseFloat);
      const viewBoxWidth = viewBoxParts[2] ?? 0;
      const viewBoxHeight = viewBoxParts[3] ?? 0;
      const viewBoxAspect = viewBoxHeight > 0 ? viewBoxWidth / viewBoxHeight : Number.POSITIVE_INFINITY;

      const nodeBySanitizedId = new Map<string, { cx: number; cy: number; w: number; h: number }>();

      for (const node of nodeElements) {
        if (!(node instanceof SVGGraphicsElement)) {
          continue;
        }

        const mapped = mapLocalBBox(node);
        const idMatch = /flowchart-(n_[0-9a-f]+)-\d+$/u.exec(node.id);

        if (mapped === null || idMatch === null || idMatch[1] === undefined) {
          continue;
        }

        nodeBySanitizedId.set(idMatch[1], {
          cx: mapped.x + mapped.w / 2,
          cy: mapped.y + mapped.h / 2,
          w: mapped.w,
          h: mapped.h,
        });
      }

      const peeringPairs: Array<{ distance: number; threshold: number }> = [];

      for (const path of svg.querySelectorAll("path")) {
        const edgeId = path.id || path.closest("g")?.id || "";

        if (edgeId.includes("edge-thickness-invisible") || path.classList.contains("edge-thickness-invisible")) {
          continue;
        }

        const style = window.getComputedStyle(path);

        if (style.stroke === "none" || style.opacity === "0" || Number.parseFloat(style.strokeWidth) === 0) {
          continue;
        }

        const match = /L_(n_[0-9a-f]+)_(n_[0-9a-f]+)_\d+$/u.exec(edgeId);

        if (match === null || match[1] === undefined || match[2] === undefined) {
          continue;
        }

        const from = nodeBySanitizedId.get(match[1]);
        const to = nodeBySanitizedId.get(match[2]);

        if (from === undefined || to === undefined) {
          continue;
        }

        const distance = Math.hypot(from.cx - to.cx, from.cy - to.cy);
        const threshold = Math.max(280, 3.5 * Math.max(from.w, from.h, to.w, to.h));
        peeringPairs.push({ distance, threshold });
      }

      const zoomPercent = Number.parseInt(
        (document.querySelector('[data-testid="architecture-diagram-zoom-input"]') as HTMLInputElement | null)?.value
          ?? "100",
        10,
      );
      const mermaidSource =
        document.querySelector('[data-testid="infra-diagrams-mermaid-source"]')?.textContent
        ?? svg.outerHTML;

      return {
        nodeCount: nodeElements.length,
        visibleNodeCount,
        minNodeHeight: nodeRects.reduce((acc, node) => Math.min(acc, node.h), Number.POSITIVE_INFINITY),
        viewBoxAspect,
        viewBoxWidth,
        viewBoxHeight,
        mappedUnionWidth,
        mappedUnionHeight,
        zoomPercent,
        cameraScrollWidth: camera.scrollWidth,
        cameraClientWidth: camera.clientWidth,
        outlineEdgeRows:
          Array.from(document.querySelectorAll("h3"))
            .find((heading) => heading.textContent?.trim() === "Edges")
            ?.parentElement?.querySelectorAll("tbody tr").length ?? 0,
        peeringPairCount: peeringPairs.length,
        peeringPairs,
        containsAlpack: mermaidSource.includes("subgraph alpack") || svg.outerHTML.includes("alpack"),
      };
    }, minNodeHeightPx);

    if (metrics === null) {
      const svg = await page.locator('[data-testid="architecture-diagram-svg-host"] svg').first();
      await testInfo.attach("sparse-peering-svg.html", {
        body: await svg.evaluate((element) => element.outerHTML),
        contentType: "text/html",
      });
    }

    expect(metrics).not.toBeNull();

    if (metrics === null) {
      return;
    }

    try {
      expect(metrics.zoomPercent).toBe(100);
      expect(metrics.nodeCount).toBe(11);
      expect(metrics.visibleNodeCount).toBeGreaterThanOrEqual(9);
      expect(metrics.viewBoxAspect).toBeLessThanOrEqual(2.5);
      expect(metrics.cameraScrollWidth).toBeLessThanOrEqual(metrics.cameraClientWidth + 2);
      expect(metrics.outlineEdgeRows).toBe(6);
      expect(metrics.minNodeHeight).toBeGreaterThanOrEqual(minNodeHeightPx);
      expect(metrics.containsAlpack).toBe(false);
      expect(metrics.peeringPairCount).toBeGreaterThanOrEqual(6);

      for (const pair of metrics.peeringPairs) {
        expect(pair.distance).toBeLessThanOrEqual(pair.threshold);
      }
    } catch (error) {
      const svg = await page.locator('[data-testid="architecture-diagram-svg-host"] svg').first();
      await testInfo.attach("sparse-peering-svg.html", {
        body: await svg.evaluate((element) => element.outerHTML),
        contentType: "text/html",
      });
      throw error;
    }
  });
});
