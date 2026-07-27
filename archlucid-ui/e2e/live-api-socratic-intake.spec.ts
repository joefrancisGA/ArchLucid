/**
 * Live API+SQL release evidence for the V1 Socratic first-use path (ADR 0055).
 * UI exercises guided intake; API helpers verify spawned review id.
 */
import { expect, test } from "@playwright/test";

import {
  admitDraftRequestLive,
  createDraftRequestLive,
  getDraftQuestionsLive,
  getRunDetails,
  liveApiBase,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  patchDraftRequestLive,
  skipDraftQuestionLive,
  submitDraftRequestLive,
} from "./helpers/live-api-client";
import { L0_ACTOR_ADDITIONAL_KINDS_QUESTION_KEY } from "./helpers/draft-intake-question-keys";
import { runIdFromReviewsHref } from "./helpers/run-id-from-href";
import {
  skipAllSocraticClarificationsInUi,
  waitForSocraticClarificationsStep,
} from "./helpers/socratic-intake";

const INTENT =
  "Design a multi-tenant Azure API platform with private SQL, Redis cache, and Entra ID authentication.";
const OUTCOME = "Reduce enterprise tenant onboarding time while preserving auditability.";

test.describe("live-api-socratic-intake", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("guided intake UI admits draft, resolves required clarifications, and spawns review", async ({ page, request }) => {
    // This walks through several sequential live API round trips (admit, questions, skip x N,
    // submit) — the 30s Playwright default has repeatedly been too tight under the extended
    // matrix's shared-API load, causing the wizard's own `toBeVisible({ timeout: 60_000 })` waits
    // to be cut short by the enclosing test timeout before they could complete.
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    await page.goto("/reviews/new");

    const guidedIntakePathTab = page.getByTestId("reviews-new-path-guided-intake");

    await expect(guidedIntakePathTab).toBeVisible({ timeout: 30_000 });

    await guidedIntakePathTab.click();
    await expect(guidedIntakePathTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("socratic-intake-wizard")).toBeVisible();

    await page.getByTestId("socratic-intent").fill(INTENT);
    await page.getByTestId("socratic-outcome").fill(OUTCOME);
    await page.getByTestId("draft-intake-actor-add").click();
    await page.getByTestId("draft-intake-actor-label-0").fill("Primary operator");
    await expect(page.getByTestId("socratic-admit")).toBeEnabled({ timeout: 15_000 });

    const admitResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/proxy/v1/architecture/draft/")
        && response.url().includes("/admit")
        && response.request().method() === "POST",
      { timeout: 90_000 },
    );

    await page.getByTestId("socratic-admit").click();

    const admitResponse = await admitResponsePromise;
    expect(
      admitResponse.ok(),
      `draft admit failed ${admitResponse.status()}: ${(await admitResponse.text()).slice(0, 400)}`,
    ).toBe(true);

    await waitForSocraticClarificationsStep(page, 90_000);

    // One-at-a-time clarifications: poll skip until Review answers enables (do not one-shot count).
    await skipAllSocraticClarificationsInUi(page, { timeoutMs: 120_000 });
    await page.getByTestId("socratic-questions-done").click();
    await page.getByTestId("socratic-submit").click();

    await page.waitForURL(/\/reviews\/[a-zA-Z0-9-]+/, { timeout: 120_000 });
    const runId = runIdFromReviewsHref(page.url());

    expect(runId.length).toBeGreaterThan(0);
    test.info().annotations.push({ type: "e2e-spawned-run-id", description: runId });

    const run = await getRunDetails(request, runId);
    expect(run.run?.runId).toBe(runId);
  });

  test("draft API lane create → admit → skip MUST → submit returns run id", async ({ request }) => {
    test.setTimeout(90_000);

    const created = await createDraftRequestLive(request, INTENT);
    const draftId = created.draftId;
    test.info().annotations.push({ type: "e2e-draft-id", description: draftId });

    await patchDraftRequestLive(request, draftId, {
      freeTextIntent: INTENT,
      businessOutcome: OUTCOME,
      systemName: "Socratic intake E2E",
      actorSet: {
        actors: [
          {
            label: "Primary operator",
            kind: "Human",
            trustOrigin: "Internal",
            contract: "Sync",
            origin: "Asserted",
            confidence: 100,
          },
        ],
      },
    });

    const admission = await admitDraftRequestLive(request, draftId);
    expect(admission.admitted).toBe(true);

    const questions = await getDraftQuestionsLive(request, draftId);
    const pending = questions.selection?.pendingMustQuestions ?? [];

    for (const question of pending) {
      await skipDraftQuestionLive(request, draftId, question.questionKey);
    }

    if (!pending.some((question) => question.questionKey === L0_ACTOR_ADDITIONAL_KINDS_QUESTION_KEY)) {
      await skipDraftQuestionLive(request, draftId, L0_ACTOR_ADDITIONAL_KINDS_QUESTION_KEY);
    }

    const submit = await submitDraftRequestLive(request, draftId);
    expect(submit.runId).toBeTruthy();

    const run = await getRunDetails(request, submit.runId!);
    expect(run.run?.runId).toBe(submit.runId);
  });
});
