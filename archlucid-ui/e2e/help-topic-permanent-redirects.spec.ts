/**
 * App Router permanent redirects for retired help topic bookmarks.
 * Vitest guards slug maps; this spec catches catch-all regressions Playwright-only.
 */
import { expect, test } from "@playwright/test";

import {
  buildHelpTopicPermanentRedirectCases,
  helpTopicRedirectUrlMatches,
} from "./help-topic-permanent-redirect-cases";

const HELP_TOPIC_PERMANENT_REDIRECT_CASES = buildHelpTopicPermanentRedirectCases();

test.describe(
  "help topic permanent redirects @help-redirects",
  { tag: ["@help-redirects", "@founder"] },
  () => {
    for (const redirectCase of HELP_TOPIC_PERMANENT_REDIRECT_CASES) {
      test(`retired ${redirectCase.retiredPath} → ${redirectCase.targetPath}${redirectCase.targetHash}`, async ({
        page,
      }) => {
        await page.goto(redirectCase.retiredPath, { waitUntil: "commit", timeout: 60_000 });

        await expect
          .poll(() => helpTopicRedirectUrlMatches(page.url(), redirectCase), { timeout: 60_000 })
          .toBe(true);

        if (redirectCase.destinationTestId !== undefined) {
          await expect(page.getByTestId(redirectCase.destinationTestId)).toBeVisible({ timeout: 60_000 });
        }
      });
    }
  },
);
