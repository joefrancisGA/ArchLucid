import { expect, type Page } from "@playwright/test";

import { liveE2eArchitectureDescription } from "./live-api-client";

/**
 * Submits the baseline simplified pilot wizard (`?baseline=1`) and returns the created run id.
 * Skips optional ZIP evidence on step 2 to keep private-beta invitee journeys within CI budget.
 */
export async function submitPrivateBetaSimplifiedPilotWizard(page: Page): Promise<string> {
  await page.goto("/architecture/reviews/new?baseline=1", { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("simplified-pilot-wizard")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 1 of 4/i, {
    timeout: 30_000,
  });

  const forward = page.getByRole("button", { name: /^(Continue|Next)$/ });

  await expect(page.getByRole("textbox", { name: "System Name" })).toBeVisible({ timeout: 30_000 });

  const systemName = page.getByRole("textbox", { name: "System Name" });
  const systemNameValue = (await systemName.inputValue()).trim();

  if (systemNameValue.length === 0) {
    await systemName.fill(`PrivateBetaInvitee-${Date.now()}`);
  }

  const description = page.getByRole("textbox", { name: "Description" });
  const descriptionText = (await description.inputValue()).trim();

  if (descriptionText.length < 10) {
    await description.fill(
      liveE2eArchitectureDescription("Private beta invitee UI wizard first meaningful action."),
    );
  }

  await forward.click();

  await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 2 of 4/i, {
    timeout: 30_000,
  });

  await forward.click();

  await expect(page.getByTestId("wizard-baseline-metrics-step")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("wizard-baseline-review-cycle-hours").fill("40");

  await forward.click();

  await expect(page.getByRole("button", { name: "Start an architecture review" })).toBeVisible({
    timeout: 60_000,
  });

  const createRespPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/proxy/v1/architecture/request") && response.request().method() === "POST",
    { timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() },
  );

  await page.getByRole("button", { name: "Start an architecture review" }).click();

  const createResp = await createRespPromise;

  expect(createResp.ok(), await createResp.text()).toBeTruthy();

  const createJson = (await createResp.json()) as { run?: { runId?: string } };
  const runId = createJson.run?.runId ?? "";

  expect(runId.length).toBeGreaterThan(0);

  return runId;
}

function liveE2ePrivateBetaWizardCreateTimeoutMs(): number {
  return process.env.CI ? 540_000 : 180_000;
}
