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
import {
  interpretWizardCreateOperation,
  parseWizardOperationResponse,
  type WizardCreateOperationPoll,
} from "./wizard-create-response";

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

  // Baseline wizard prefills CustomerWebApp. A timed-out first attempt still occupies that name,
  // so Playwright retry 409s with "A review named 'CustomerWebApp' already exists".
  await systemName.fill(uniquePrivateBetaSystemName("PrivateBetaInvitee"));

  const description = page.getByRole("textbox", { name: "Description" });
  const descriptionText = (await description.inputValue()).trim();

  if (descriptionText.length < 10) {
    await description.fill(
      liveE2eArchitectureDescription("Private beta invitee UI wizard first meaningful action."),
    );
  }

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

  if (createResp.status() === 202) {
    return await waitForAsyncWizardRun(page, createResp.headers()["location"]);
  }

  return readCreatedRunIdFromArchitectureRequestCreate({
    status: createResp.status(),
    bodyText,
    location: createResp.headers()["location"],
  });
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

async function waitForAsyncWizardRun(page: Page, location: string | undefined): Promise<string> {
  if (!location) {
    throw new Error(
      "[wizard-create-response] Async create response did not include a Location header.",
    );
  }

  const operationUrl = toProxyOperationUrl(page.url(), location);
  const deadline = Date.now() + liveE2ePrivateBetaWizardCreateTimeoutMs();

  while (Date.now() < deadline) {
    const operationResponse = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      return {
        body: await response.text(),
        contentType: response.headers.get("content-type") ?? undefined,
        status: response.status,
      };
    }, operationUrl);

    if (!operationResponse.status || operationResponse.status < 200 || operationResponse.status >= 300) {
      throw new Error(
        `[wizard-create-response] Async operation poll failed. ` +
          `Status: ${operationResponse.status}. URL: ${operationUrl}. ` +
          `Body: ${operationResponse.body.slice(0, 400) || "<empty>"}.`,
      );
    }

    const operation = parseWizardOperationResponse(
      operationResponse.body,
      operationResponse.status,
      operationUrl,
      operationResponse.contentType,
    );
    const poll: WizardCreateOperationPoll = interpretWizardCreateOperation(operation);

    if (poll === "ready") {
      const runId =
        operation.resultRef?.runId?.trim() || parseRunIdFromOperationUrl(operationUrl) || "";

      if (runId.length === 0) {
        throw new Error(
          `[wizard-create-response] Async operation succeeded without a run id. URL: ${operationUrl}.`,
        );
      }

      return runId;
    }

    if (poll === "failed") {
      const runId =
        operation.resultRef?.runId?.trim() ||
        parseRunIdFromOperationUrl(operationUrl) ||
        "";
      const lastFailureReason =
        runId.length > 0
          ? await readRunLastFailureReasonViaProxy(page, operationUrl, runId)
          : undefined;
      const failureDetail =
        lastFailureReason && lastFailureReason.length > 0
          ? ` LastFailureReason: ${lastFailureReason.slice(0, 500)}.`
          : "";

      throw new Error(
        `[wizard-create-response] Async operation ended in ${operation.state} state. ` +
          `URL: ${operationUrl}. Step: ${operation.stepLabel ?? "unknown"}.${failureDetail}`,
      );
    }

    await page.waitForTimeout(1_000);
  }

  throw new Error(
    `[wizard-create-response] Async operation did not complete before the timeout. ` +
      `URL: ${operationUrl}.`,
  );
}

function toProxyOperationUrl(pageUrl: string, location: string): string {
  const operationUrl = new URL(location, pageUrl);

  if (operationUrl.pathname.startsWith("/v1/")) {
    operationUrl.pathname = `/api/proxy${operationUrl.pathname}`;
  }

  return operationUrl.toString();
}

function parseRunIdFromOperationUrl(operationUrl: string): string | undefined {
  const match = operationUrl.match(/run:([0-9a-f-]{36})/i);
  return match?.[1];
}

async function readRunLastFailureReasonViaProxy(
  page: Page,
  operationUrl: string,
  runId: string,
): Promise<string | undefined> {
  const pageOrigin = new URL(operationUrl).origin;
  const reviewUrl = `${pageOrigin}/api/proxy/v1/authority/reviews/${encodeURIComponent(runId)}`;
  const response = await page.evaluate(async (url) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    return { status: res.status, body: await res.text() };
  }, reviewUrl);

  if (!response.status || response.status < 200 || response.status >= 300) {
    return undefined;
  }

  try {
    const json = JSON.parse(response.body) as {
      lastFailureReason?: string | null;
      run?: { lastFailureReason?: string | null };
    };

    return json.lastFailureReason ?? json.run?.lastFailureReason ?? undefined;
  } catch {
    return undefined;
  }
}
