import { expect, test } from "@playwright/test";

test.describe("Quick Scan (mocked API)", () => {
  test("fills required fields and shows at least one finding card", async ({ page }) => {
    await page.route("**/api/proxy/v1/architecture/quick-scan", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          scanId: "scan-mock-playwright-001",
          summary: "Mock quick scan: reviewed networking and data boundaries for the described system.",
          completedUtc: new Date().toISOString(),
          findings: [
            {
              title: "Segment internal data paths",
              description: "Ensure storage and internal APIs stay on private endpoints with least-privilege RBAC.",
              severity: 1,
            },
          ],
        }),
      });
    });

    await page.goto("/quick-scan");

    await expect(page.getByRole("heading", { name: /^Quick scan$/i })).toBeVisible();

    await page.getByLabel(/^System name$/i).fill("Playwright fixture system");
    await page.getByLabel(/^Cloud provider$/i).fill("Azure");
    await page.getByLabel(/^Description$/i).fill("Three-tier web application with internal APIs and blob storage.");

    await page.getByTestId("quick-scan-submit").click();

    await expect(page.getByTestId("quick-scan-results")).toBeVisible();
    await expect(page.getByTestId("quick-scan-finding-card").first()).toBeVisible();
  });
});
