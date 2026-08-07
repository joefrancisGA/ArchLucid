import { type Locator } from "@playwright/test";

import { SHOWCASE_DEMO_RUN_ID } from "../fixtures";

/** Recent packages section on the buyer-polished reviews hub (`/architecture/reviews`). */
export function reviewsHubRecentPackagesSection(main: Locator): Locator {
  return main.getByTestId("reviews-hub-recent-packages").first();
}

/**
 * Buyer-polished `/architecture/reviews` hub table row for a package (sample reviews use `reviews-hub-sample-row`).
 */
export function reviewsHubPackageRow(main: Locator, runId: string = SHOWCASE_DEMO_RUN_ID): Locator {
  return main
    .getByTestId(`reviews-hub-row-${runId}`)
    .or(main.getByTestId("reviews-hub-sample-row"));
}

/** Primary explore action on a reviews hub package row. */
export function reviewsHubPackagePrimaryAction(main: Locator, runId: string = SHOWCASE_DEMO_RUN_ID): Locator {
  return main.getByTestId(`reviews-hub-primary-action-${runId}`);
}

/** First visible package row on the buyer-polished reviews hub (sample or real). */
export function reviewsHubFirstPackageRow(main: Locator): Locator {
  return main
    .locator('[data-testid^="reviews-hub-row-"]')
    .or(main.getByTestId("reviews-hub-sample-row"))
    .first();
}
