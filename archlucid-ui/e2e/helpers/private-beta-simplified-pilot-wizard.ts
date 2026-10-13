import { expect, type Page } from "@playwright/test";

import { liveE2eArchitectureDescription } from "./live-api-client";
import { formatSimplifiedPilotWizardMountFailure } from "./simplified-pilot-wizard-mount-failure";
import { clickThroughBlockingOverlays } from "./dismiss-blocking-modal-overlays";
import { ensureFirstSessionPurposeChooserClosed } from "./live-seat-scope-assertions";
import { parseWizardCreateResponse, parseWizardOperationResponse } from "./wizard-create-response";

/**
 * Submits the baseline simplified pilot wizard (`?baseline=1`) and returns the created run id.
 * Skips optional ZIP evidence on step 2 to keep private-beta invitee journeys within CI budget.
 */
export async function submitPrivateBetaSimplifiedPilotWizard(page: Page): Promise<string> {
  await page.goto("/architecture/reviews/new?baseline=1", { waitUntil: "domcontentloaded" });

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
    (response) =>
      response.url().includes("/api/proxy/v1/architecture/request") && response.request().method() === "POST",
    { timeout: liveE2ePrivateBetaWizardCreateTimeoutMs() },
  );

  await page.getByRole("button", { name: "Start an architecture review" }).click();

  const createResp = await createRespPromise;
  const createBody = await createResp.text();

  expect(createResp.ok(), createBody).toBeTruthy();

  if (createResp.status() === 202) {
    return await waitForAsyncWizardRun(page, createResp.headers()["location"]);
  }

  const createJson = parseWizardCreateResponse(
    createBody,
    createResp.status(),
    createResp.headers()["content-type"],
  );
  const runId = createJson.run?.runId ?? "";

  expect(runId.length).toBeGreaterThan(0);

  return runId;
}

function liveE2ePrivateBetaWizardCreateTimeoutMs(): number {
  return process.env.CI ? 540_000 : 180_000;
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
    const state = operation.state?.toLowerCase();

    if (state === "succeeded") {
      const runId = operation.resultRef?.runId ?? "";

      if (runId.length === 0) {
        throw new Error(
          `[wizard-create-response] Async operation succeeded without a run id. URL: ${operationUrl}.`,
        );
      }

      return runId;
    }

    if (state === "failed" || state === "canceled") {
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
  const reviewUrl = `${pageOrigin}/api/proxy/v1/authority/runs/${encodeURIComponent(runId)}`;
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
