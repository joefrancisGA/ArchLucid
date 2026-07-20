import { expect, test } from "@playwright/test";

test.describe("Quick Scan (mocked API)", () => {
  test("fills required fields and shows at least one finding card", async ({ page }) => {
    await page.route("**/api/proxy/v1/marketing/quick-scan/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          enabled: true,
          capacityAvailable: true,
          requireSignIn: false,
          sampleResultAvailable: true,
        }),
      });
    });

    await page.route("**/api/proxy/v1/marketing/quick-scan", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          scanId: "scan-mock-playwright-001",
          systemName: "Playwright fixture system",
          primaryEnvironment: "Azure",
          summary: "Mock quick scan: reviewed networking and data boundaries for the described system.",
          completedUtc: new Date().toISOString(),
          positiveObservations: ["Clear separation between public API and internal workers."],
          recommendedNextSteps: ["Start a full review with evidence attachments."],
          demonstrationDisclaimer: "Demonstration only.",
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

    await page.getByLabel(/System name/i).fill("Playwright fixture system");
    await page.getByLabel(/Primary environment/i).selectOption("Azure");
    await page.getByLabel(/Describe the system/i).fill("Three-tier web application with internal APIs and blob storage.");

    await page.getByTestId("quick-scan-submit").click();

    await expect(page.getByTestId("quick-scan-results")).toBeVisible();
    await expect(page.getByTestId("quick-scan-finding-card").first()).toBeVisible();
  });
});
