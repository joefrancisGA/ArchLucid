/**
 * Mock-backed regression for Executive **May access** authorization overlay (AX-DC-07).
 */
import { expect, test } from "@playwright/test";

import { executiveMayAccessRenderResponse } from "./fixtures/infra-diagrams-mermaid";

const releaseGateTag = "@release-gate";
const snapshotId = "22222222-2222-2222-2222-222222222222";

async function mockExecutiveMayAccessRoutes(page: import("@playwright/test").Page): Promise<void> {
  const renderResponse = executiveMayAccessRenderResponse();

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
              nodeCount: 2,
              edgeCount: 1,
              mermaid: null,
              fallbackArtifacts: [],
            },
          ],
          completenessWarnings: [],
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
            resourceCount: 2,
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

test.describe(`infra-evidence-executive-may-access (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.setTimeout(120_000);

  test("executive outline exposes May access between web app and SQL database", async ({ page }) => {
    await mockExecutiveMayAccessRoutes(page);

    await page.goto(
      `/governance/infrastructure/diagrams?snapshotId=${snapshotId}&mermaidMode=executive`,
      { waitUntil: "domcontentloaded" },
    );

    await page.getByTestId("infra-diagrams-outline-edges-disclosure").click();
    await expect(page.getByTestId("infra-diagrams-outline-edges-panel")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("May access")).toBeVisible();
    await expect(page.getByText("orders-api")).toBeVisible();
    await expect(page.getByText("orders-db")).toBeVisible();
  });
});
