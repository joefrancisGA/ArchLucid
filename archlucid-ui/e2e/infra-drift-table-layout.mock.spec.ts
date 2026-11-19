/**
 * Mock-backed layout ratchet for Drift & snapshots change table (IE-DT-04).
 */
import { expect, test } from "@playwright/test";

const releaseGateTag = "@release-gate";

const snapshotId = "22222222-2222-2222-2222-222222222222";
const changeRowCount = 10;

function buildDriftChangeItems(): Array<Record<string, unknown>> {
  return Array.from({ length: changeRowCount }, (_, index) => {
    const rowNumber = index + 1;

    return {
      changeId: `change-${rowNumber}`,
      diffId: "diff-1",
      cloudResourceId: `11111111-1111-1111-1111-1111111111${String(rowNumber).padStart(2, "0")}`,
      azureResourceId:
        `/subscriptions/sub/resourceGroups/rg-net-${rowNumber}/providers/Microsoft.Network/publicIPAddresses/gateway-${rowNumber}`,
      changeType: "Modified",
      property: "sku",
      oldValue: "Basic",
      newValue: "Standard",
      riskClassification: rowNumber % 3 === 0 ? "Medium" : null,
      evidenceReference: "snapshot-diff",
    };
  });
}

test.describe(`infra-drift-table-layout (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/proxy/v1/infra-evidence/snapshots**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              snapshotId,
              subscriptionName: "Prod",
              capturedUtc: "2026-01-01T00:00:00Z",
              resourceCount: changeRowCount,
            },
          ],
          totalCount: 1,
          page: 1,
          pageSize: 50,
          hasMore: false,
        }),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/snapshots/*/diffs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            diffId: "diff-1",
            snapshotAId: snapshotId,
            snapshotBId: "33333333-3333-3333-3333-333333333333",
            totalChanges: changeRowCount,
            createdUtc: "2026-01-02T00:00:00Z",
          },
        ]),
      });
    });

    await page.route("**/api/proxy/v1/infra-evidence/diffs/*/changes**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: buildDriftChangeItems(),
          totalCount: changeRowCount,
          page: 1,
          pageSize: 100,
          hasMore: false,
        }),
      });
    });
  });

  test("drift change rows stay readable without overlapping paint", async ({ page }) => {
    await page.goto(`/governance/infrastructure/drift?snapshotId=${snapshotId}&diffId=diff-1`);

    const table = page.getByRole("table", { name: "Inventory drift changes" });
    await expect(table).toBeVisible({ timeout: 60_000 });

    const body = page.getByTestId("infra-drift-changes-body");
    const rows = body.locator("tr");
    await expect(rows).toHaveCount(changeRowCount, { timeout: 30_000 });

    const rowBoxes: Array<{ y: number; height: number }> = [];

    for (let index = 0; index < changeRowCount; index += 1) {
      const box = await rows.nth(index).boundingBox();

      expect(box, `row ${index + 1} should have a layout box`).not.toBeNull();

      if (box == null) {
        continue;
      }

      expect(box.height).toBeGreaterThanOrEqual(36);
      rowBoxes.push({ y: box.y, height: box.height });
    }

    for (let index = 1; index < rowBoxes.length; index += 1) {
      const previous = rowBoxes[index - 1];
      const current = rowBoxes[index];

      expect(previous.y + previous.height).toBeLessThanOrEqual(current.y + 1);
    }

    const firstCell = rows.first().locator("td").first();
    const fontSize = await firstCell.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    const clientWidth = await firstCell.evaluate((element) => element.clientWidth);

    expect(fontSize).toBeGreaterThanOrEqual(13);
    expect(clientWidth).toBeGreaterThanOrEqual(80);
  });

  test("resumes the saved diff and change while snapshot inventory is loading", async ({ page }) => {
    const diffId = "diff-1";
    const changeId = "change-2";
    await page.addInitScript((selection) => {
      localStorage.setItem("archlucid_drift_last_comparison_selection_v1", JSON.stringify(selection));
    }, { snapshotId, diffId, changeId });

    // Let the inventory request start before the diff becomes available.
    // This keeps the restore path in the loading state that used to lose the saved change.
    let inventoryRequested!: () => void;
    const inventoryStarted = new Promise<void>((resolve) => { inventoryRequested = resolve; });
    let releaseInventory!: () => void;
    const inventoryRelease = new Promise<void>((resolve) => { releaseInventory = resolve; });
    let releaseChanges!: () => void;
    const changesRelease = new Promise<void>((resolve) => { releaseChanges = resolve; });

    await page.route(`**/api/proxy/v1/infra-evidence/snapshots/${snapshotId}/inventory-rows**`, async (route) => {
      inventoryRequested();
      await inventoryRelease;
      await route.fulfill({ json: { items: [], totalCount: 0, page: 1, pageSize: 50, hasMore: false } });
    });
    await page.route(`**/api/proxy/v1/infra-evidence/snapshots/${snapshotId}/diffs**`, async (route) => {
      await inventoryStarted;
      await route.fallback();
    });
    await page.route(`**/api/proxy/v1/infra-evidence/diffs/${diffId}/changes**`, async (route) => {
      await changesRelease;
      await route.fallback();
    });

    try {
      await page.goto("/governance/infrastructure/drift");
      await page.getByTestId("infra-drift-resume-last-comparison-open").click({ timeout: 60_000 });
      await expect(page.getByTestId("infra-drift-diff-picker")).toHaveValue(diffId, { timeout: 30_000 });
      await expect(page).toHaveURL((url) =>
        url.searchParams.get("snapshotId") === snapshotId
        && url.searchParams.get("diffId") === diffId
        && url.searchParams.get("changeId") === changeId,
      );
      await expect(page.getByTestId("infra-drift-changes-body")).toContainText("Loading changes…");

      releaseChanges();
      await expect(page.getByTestId(`infra-drift-change-row-${changeId}`)).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId(`infra-drift-change-detail-row-${changeId}`)).toBeVisible();
    } finally {
      inventoryRequested();
      releaseInventory();
      releaseChanges();
    }
  });
});
