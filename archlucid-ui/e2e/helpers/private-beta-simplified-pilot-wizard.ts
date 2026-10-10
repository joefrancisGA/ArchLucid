import { expect, type Locator, type Page } from "@playwright/test";

import { injectDefaultTenantOperatorScope } from "./demo-workspace-live-scope";
import {
  clickThroughBlockingOverlays,
  dismissBlockingModalOverlays,
} from "./dismiss-blocking-modal-overlays";
import { liveE2eArchitectureDescription } from "./live-api-client";
import { dismissFirstSessionPurposeChooserIfVisible } from "./live-seat-scope-assertions";
import { writeJwtBrowserSession } from "./live-private-beta-access";
import {
  parsePrivateBetaCommittedRunId,
} from "./private-beta-create-identity";

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

  return waitForPrivateBetaWizardCreatedRunId(page, startReview);
}

async function waitForPrivateBetaWizardCreatedRunId(page: Page, startReview: Locator): Promise<string> {
  await expect(startReview).toBeVisible({ timeout: 60_000 });

  let resolvedRunId = "";

  const captureCreatePost = page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/proxy/v1/architecture/request") &&
        response.request().method() === "POST",
      { timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() },
    )
    .then(async (response) => {
      const bodyText = (await response.text()).trim();
      resolvedRunId =
        extractRunIdFromArchitectureCreateResponse(response.status(), bodyText) ?? resolvedRunId;
    })
    .catch(() => undefined);

  const captureReviewPoll = page
    .waitForResponse(
      (response) => {
        const runId = parseRunIdFromProxyReviewUrl(response.url());

        return (
          runId !== null &&
          response.request().method() === "GET" &&
          response.ok()
        );
      },
      { timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() },
    )
    .then((response) => {
      resolvedRunId = parseRunIdFromProxyReviewUrl(response.url()) ?? resolvedRunId;
    })
    .catch(() => undefined);

  await dismissFirstSessionPurposeChooserIfVisible(page);
  await dismissBlockingModalOverlays(page);
  await clickThroughBlockingOverlays(page, startReview);

  await Promise.race([
    captureCreatePost,
    captureReviewPoll,
    page.getByTestId("new-run-wizard-progress").waitFor({ state: "visible", timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() }),
  ]);

  await expect(async () => {
    if (resolvedRunId.length > 0) {
      return;
    }

    const pollResponse = await page.waitForResponse(
      (response) => {
        const runId = parseRunIdFromProxyReviewUrl(response.url());

        return (
          runId !== null &&
          response.request().method() === "GET" &&
          response.ok()
        );
      },
      { timeout: 60_000 },
    );

    resolvedRunId = parseRunIdFromProxyReviewUrl(pollResponse.url()) ?? "";
    expect(resolvedRunId.length).toBeGreaterThan(0);
  }).toPass({ timeout: 120_000 });

  return resolvedRunId;
}

function extractRunIdFromArchitectureCreateResponse(status: number, bodyText: string): string | null {
  const committedRunId = parsePrivateBetaCommittedRunId(status, bodyText);

  if (committedRunId !== null) {
    return committedRunId;
  }

  if (bodyText.length === 0) {
    return null;
  }

  try {
    const createJson = JSON.parse(bodyText) as { run?: { runId?: string } };
    const runId = createJson.run?.runId?.trim() ?? "";

    return runId.length > 0 ? runId : null;
  } catch {
    return null;
  }
}

function parseRunIdFromProxyReviewUrl(url: string): string | null {
  const match = url.match(
    /\/api\/proxy\/v1\/authority\/reviews\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i,
  );

  return match?.[1] ?? null;
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
