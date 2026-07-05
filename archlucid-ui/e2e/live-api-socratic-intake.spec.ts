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
  patchDraftRequestLive,
  skipDraftQuestionLive,
  submitDraftRequestLive,
} from "./helpers/live-api-client";
import { L0_ACTOR_ADDITIONAL_KINDS_QUESTION_KEY } from "./helpers/draft-intake-question-keys";

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
    await page.goto("/reviews/new");

    // The path switcher is collapsed behind a "More options" affordance for first-run tenants
    // (no committed manifest yet) and shown immediately once the tenant has review history ΓÇö
    // wait for whichever renders, then reveal the switcher if needed before selecting guided intake.
    const moreIntakeOptions = page.getByTestId("reviews-new-more-intake-options");
    const guidedIntakePathTab = page.getByTestId("reviews-new-path-guided-intake");

    await expect(moreIntakeOptions.or(guidedIntakePathTab)).toBeVisible({ timeout: 30_000 });

    if (await moreIntakeOptions.isVisible()) {
      await moreIntakeOptions.click();
    }

    await guidedIntakePathTab.click();
    await expect(guidedIntakePathTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("socratic-intake-wizard")).toBeVisible();

    await page.getByTestId("socratic-intent").fill(INTENT);
    await page.getByTestId("socratic-outcome").fill(OUTCOME);
    await page.getByTestId("draft-intake-actor-add").click();
    await page.getByTestId("draft-intake-actor-label-0").fill("Primary operator");
    await expect(page.getByTestId("socratic-admit")).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId("socratic-admit").click();

    await expect(page.getByTestId("socratic-questions-done")).toBeVisible({ timeout: 60_000 });

    const questionBlocks = page.getByTestId("socratic-question");
    const questionCount = await questionBlocks.count();

    for (let index = 0; index < questionCount; index++) {
      await questionBlocks.nth(index).getByRole("button", { name: "Skip this clarification" }).click();
    }

    await page.getByTestId("socratic-questions-done").click();
    await page.getByTestId("socratic-submit").click();

    await page.waitForURL(/\/reviews\/[a-zA-Z0-9-]+/, { timeout: 120_000 });
    const spawnedUrl = page.url();
    const runId = spawnedUrl.split("/reviews/")[1]?.split(/[?#]/)[0] ?? "";

    expect(runId.length).toBeGreaterThan(0);
    test.info().annotations.push({ type: "e2e-spawned-run-id", description: runId });

    const run = await getRunDetails(request, runId);
    expect(run.run?.runId).toBe(runId);
  });

  test("draft API lane create → admit → skip MUST → submit returns run id", async ({ request }) => {
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
