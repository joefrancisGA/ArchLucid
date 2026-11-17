import { expect, type Page, type Response } from "@playwright/test";

import {
  isArchitectureRequestCreateResponse,
  readCreatedRunIdFromArchitectureRequestCreate,
} from "./architecture-request-create-response";
import { liveE2eArchitectureDescription, uniquePrivateBetaSystemName } from "./live-api-client";
import { formatSimplifiedPilotWizardMountFailure } from "./simplified-pilot-wizard-mount-failure";
import { clickThroughBlockingOverlays } from "./dismiss-blocking-modal-overlays";
import {
  ensureFirstSessionPurposeChooserClosed,
  waitAndDismissFirstSessionPurposeChooser,
} from "./live-seat-scope-assertions";

/**
 * Working desks redirect `/architecture/reviews/new` when `path` is absent (DA-09).
 * Keep `path=detailed` so `baseline=1` can mount SimplifiedPilotWizard instead of Create architecture.
 */
export const PRIVATE_BETA_SIMPLIFIED_PILOT_WIZARD_HREF =
  "/architecture/reviews/new?path=detailed&baseline=1";

/**
 * Submits the baseline simplified pilot wizard (`?baseline=1`) and returns the created run id.
 * Skips optional ZIP evidence on step 2 to keep private-beta invitee journeys within CI budget.
 */
export async function submitPrivateBetaSimplifiedPilotWizard(page: Page): Promise<string> {
  await page.goto(PRIVATE_BETA_SIMPLIFIED_PILOT_WIZARD_HREF, { waitUntil: "domcontentloaded" });
  await waitAndDismissFirstSessionPurposeChooser(page);

  try {
    await expect(page.getByTestId("simplified-pilot-wizard")).toBeVisible({ timeout: 60_000 });
  } catch (error: unknown) {
    const visibleShells = [
      (await page.getByTestId("reviews-new-working-redirect").isVisible().catch(() => false))
        ? "reviews-new-working-redirect"
        : null,
      (await page.getByTestId("reviews-new-path-switcher").isVisible().catch(() => false))
        ? "reviews-new-path-switcher"
        : null,
      (await page.getByTestId("simplified-pilot-progress").isVisible().catch(() => false))
        ? "simplified-pilot-progress"
        : null,
      (await page.getByText(/Something went wrong/i).isVisible().catch(() => false))
        ? "generic-error-shell"
        : null,
    ].filter((marker): marker is string => marker !== null);
    const stepOneRendered = await page
      .getByTestId("simplified-pilot-progress")
      .getByText(/step 1 of 4/i)
      .isVisible()
      .catch(() => false);
    throw new Error(
      formatSimplifiedPilotWizardMountFailure({
        pageUrl: page.url(),
        visibleShells,
        stepOneRendered,
      }),
      { cause: error },
    );
  }

  await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 1 of 4/i, {
    timeout: 30_000,
  });

  const forward = page.getByRole("button", { name: /^(Continue|Next)$/ });

  await expect(page.getByRole("textbox", { name: "System Name" })).toBeVisible({ timeout: 30_000 });

  const systemName = page.getByRole("textbox", { name: "System Name" });

  // Baseline wizard prefills CustomerWebApp. Earlier private-beta cases in the same SQL catalog
  // already commit that name, and a timed-out first attempt still occupies it, so Playwright
  // retry 409s with "A review named 'CustomerWebApp' already exists" unless this create is unique.
  await systemName.fill(uniquePrivateBetaSystemName("PrivateBetaInvitee"));

  const description = page.getByRole("textbox", { name: "Description" });
  const descriptionText = (await description.inputValue()).trim();

  if (descriptionText.length < 10) {
    await description.fill(
      liveE2eArchitectureDescription("Private beta invitee UI wizard first meaningful action."),
    );
  }

  await ensureSimplifiedPilotEnvironmentSelected(page);
  await ensureFirstSessionPurposeChooserClosed(page, 60_000);
  await clickThroughBlockingOverlays(page, forward);

  await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 2 of 4/i, {
    timeout: 30_000,
  });

  await ensureFirstSessionPurposeChooserClosed(page, 60_000);
  await clickThroughBlockingOverlays(page, forward);

  await expect(page.getByTestId("wizard-baseline-metrics-step")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("wizard-baseline-review-cycle-hours").fill("40");

  await ensureFirstSessionPurposeChooserClosed(page, 60_000);
  await clickThroughBlockingOverlays(page, forward);

  await expect(page.getByRole("button", { name: "Start an architecture review" })).toBeVisible({
    timeout: 60_000,
  });

  const createRespPromise = page.waitForResponse(
    (response) => isArchitectureRequestCreateResponse(toCreateResponseArgs(response)),
    { timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() },
  );

  await page.getByRole("button", { name: "Start an architecture review" }).click();

  const createResp = await createRespPromise;
  const bodyText = await createResp.text();

  expect(
    createResp.ok(),
    `POST /architecture/request failed ${String(createResp.status())}: ${bodyText}`,
  ).toBeTruthy();

  // Async create admits with 202 + Location while LegacyRunStatus stays Created, so
  // GET /v1/operations/run:{id} stays Pending. Polling for Succeeded times out after a
  // successful pipeline (run 38402768097). Callers wait on the reviews list instead.
  return readCreatedRunIdFromArchitectureRequestCreate({
    status: createResp.status(),
    bodyText,
    location: createResp.headers()["location"],
  });
}

/** Step 0 requires a lifecycle environment; Radix Select is not filled by `fill()` on System Name. */
async function ensureSimplifiedPilotEnvironmentSelected(page: Page): Promise<void> {
  const trigger = page.locator("#wizard-environment");

  if (!(await trigger.isVisible().catch(() => false))) {
    return;
  }

  const current = ((await trigger.textContent()) ?? "").trim();

  if (current.length > 0 && !/select environment/i.test(current)) {
    return;
  }

  await trigger.click();
  await page.getByRole("option", { name: "Production" }).click();
}

function toCreateResponseArgs(response: Response): {
  url: string;
  method: string;
} {
  return {
    url: response.url(),
    method: response.request().method(),
  };
}

function liveE2ePrivateBetaWizardCreateTimeoutMs(): number {
  // Async create is stub + enqueue (202). The previous 540s CI budget waited for a JSON
  // sync body that Real-mode wizard create never sends.
  return process.env.CI ? 120_000 : 180_000;
}
