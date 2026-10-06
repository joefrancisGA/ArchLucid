import { expect, type Locator, type Page } from "@playwright/test";

import { injectDefaultTenantOperatorScope } from "./demo-workspace-live-scope";
import {
  clickThroughBlockingOverlays,
  dismissBlockingModalOverlays,
} from "./dismiss-blocking-modal-overlays";
import { liveE2eArchitectureDescription } from "./live-api-client";
import { dismissFirstSessionPurposeChooserIfVisible } from "./live-seat-scope-assertions";
import { writeJwtBrowserSession } from "./live-private-beta-access";

const REVIEWS_NEW_BASELINE_WIZARD_PATH = "/architecture/reviews/new?baseline=1&path=detailed";

/**
 * Submits the baseline simplified pilot wizard (`?baseline=1`) and returns the created run id.
 * Skips optional ZIP evidence on step 2 to keep private-beta invitee journeys within CI budget.
 */
export async function submitPrivateBetaSimplifiedPilotWizard(
  page: Page,
  options?: { readonly jwtAccessToken?: string },
): Promise<string> {
  const jwtAccessToken = options?.jwtAccessToken?.trim() ?? "";

  await expect(async () => {
    if (jwtAccessToken.length > 0) {
      await writeJwtBrowserSession(page, jwtAccessToken);
      await injectDefaultTenantOperatorScope(page, {
        reestablishJwtSession: false,
        jwtAccessToken,
        sampleWorkspaceVisitActive: false,
      });
    }

    await page.evaluate(() => {
      window.localStorage.setItem("archlucid.workspace-mode.v1.personal", "guided");
    });

    await page.goto(REVIEWS_NEW_BASELINE_WIZARD_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("reviews-new-path-switcher")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("simplified-pilot-wizard")).toBeVisible({ timeout: 20_000 });
  }).toPass({ timeout: 120_000 });
  await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 1 of 4/i, {
    timeout: 30_000,
  });

  await dismissFirstSessionPurposeChooserIfVisible(page);
  await dismissBlockingModalOverlays(page);

  const wizard = page.getByTestId("simplified-pilot-wizard");
  const nextButton = wizard.getByRole("button", { name: /^Next$/ });

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

  await description.press("Tab");

  await clickSimplifiedPilotWizardNext(page, nextButton, /step 2 of 4/i);

  await clickSimplifiedPilotWizardNext(page, nextButton, /step 3 of 4/i);

  await expect(page.getByTestId("wizard-baseline-metrics-step")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("wizard-baseline-review-cycle-hours").fill("40");

  await clickSimplifiedPilotWizardNext(page, nextButton, /step 4 of 4/i);

  const startReview = wizard.getByRole("button", { name: "Start an architecture review" });

  await expect(startReview).toBeVisible({
    timeout: 60_000,
  });

  let runId = "";

  await expect(async () => {
    await dismissFirstSessionPurposeChooserIfVisible(page);
    await dismissBlockingModalOverlays(page);
    await expect(startReview).toBeEnabled({ timeout: 10_000 });

    const createRespPromise = page.waitForResponse(
      (response) => {
        if (!response.url().includes("/api/proxy/v1/architecture/request")) {
          return false;
        }

        if (response.request().method() !== "POST") {
          return false;
        }

        const status = response.status();

        return status === 200 || status === 201;
      },
      { timeout: 120_000 },
    );

    await clickThroughBlockingOverlays(page, startReview);

    const createResp = await createRespPromise;
    const bodyText = (await createResp.text()).trim();

    expect(bodyText.length, `empty architecture create body (HTTP ${createResp.status()})`).toBeGreaterThan(0);

    let createJson: { run?: { runId?: string } };

    try {
      createJson = JSON.parse(bodyText) as { run?: { runId?: string } };
    } catch {
      throw new Error(`architecture create response was not JSON: ${bodyText.slice(0, 400)}`);
    }

    runId = createJson.run?.runId ?? "";
    expect(runId.length).toBeGreaterThan(0);
  }).toPass({ timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() });

  return runId;
}

async function clickSimplifiedPilotWizardNext(
  page: Page,
  nextButton: Locator,
  expectedProgress: RegExp,
): Promise<void> {
  await expect(async () => {
    await dismissFirstSessionPurposeChooserIfVisible(page);
    await dismissBlockingModalOverlays(page);
    await expect(nextButton).toBeEnabled({ timeout: 10_000 });
    await clickThroughBlockingOverlays(page, nextButton);
    await expect(page.getByTestId("simplified-pilot-progress")).toContainText(expectedProgress, {
      timeout: 20_000,
    });
  }).toPass({ timeout: 120_000 });
}

function liveE2ePrivateBetaWizardCreateTimeoutMs(): number {
  return process.env.CI ? 540_000 : 180_000;
}
