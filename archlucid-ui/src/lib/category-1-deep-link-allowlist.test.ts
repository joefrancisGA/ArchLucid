import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import {
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

/** TB-2051 — hubs that name a tab/route in Category-1 copy must expose at least one deep link. */
const ALLOWLIST: readonly {
  readonly pathname: string;
  readonly nextHref?: string;
  readonly configureHref?: string;
}[] = [
  {
    pathname: "/architecture/digests",
    nextHref: DIGESTS_SCHEDULE_TAB_PATH,
    configureHref: DIGESTS_SCHEDULE_TAB_PATH,
  },
  {
    pathname: "/help/digests",
    nextHref: DIGESTS_SCHEDULE_TAB_PATH,
    configureHref: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  },
  {
    pathname: "/administration/system-health",
    nextHref: "/administration/connection-status",
    configureHref: "/administration/connection-status",
  },
  {
    pathname: "/administration/connection-status",
    nextHref: "/administration/system-health",
  },
  {
    pathname: SPONSOR_DASHBOARD_HREF,
    nextHref: GOVERNANCE_APPROVAL_QUEUE_PATH,
  },
  {
    pathname: "/governance/approval-queue",
    nextHref: "/governance/findings",
    configureHref: GOVERNANCE_WORKSPACE_HEALTH_HREF,
  },
  {
    pathname: "/help/subprocessors",
    nextHref: "/help/getting-started",
    configureHref: "/help/troubleshooting",
  },
  {
    pathname: "/help/accelerator-chooser",
    nextHref: "/help/choose-your-next-step",
    configureHref: "/architecture/reviews/new",
  },
  {
    pathname: "/help/admin-diagnostics",
    nextHref: "/administration/system-health",
    configureHref: "/help/engineering-troubleshooting",
  },
  {
    pathname: "/help/authentication-sign-in",
    nextHref: "/help/users-and-roles",
    configureHref: "/administration/account-security",
  },
  {
    pathname: "/help/azure-boards",
    nextHref: "/integrations/azure-boards",
    configureHref: "/help/integration-readiness",
  },
  {
    pathname: "/help/caiq-sig-response",
    nextHref: "/help/soc2-self-assessment",
    configureHref: "/trust",
  },
  {
    pathname: "/help/cloud-connections/aws",
    nextHref: "/integrations/cloud-connections/aws",
    configureHref: "/help/cloud-connections",
  },
  {
    pathname: "/help/cloud-connections/gcp",
    nextHref: "/integrations/cloud-connections/gcp",
    configureHref: "/help/cloud-connections",
  },
  {
    pathname: "/help/comparison-replay",
    nextHref: "/insights/compare-two-reviews",
    configureHref: "/internal/validate-route",
  },
  {
    pathname: "/governance/approval-requests/sample/lineage",
    nextHref: GOVERNANCE_APPROVAL_QUEUE_PATH,
  },
  {
    pathname: "/governance/decision-register",
    nextHref: REVIEWS_LIST_PATH,
  },
  {
    pathname: "/governance/advisory-scans",
    nextHref: ADVISORY_SCANS_SCHEDULES_HREF,
    configureHref: REVIEWS_LIST_PATH,
  },
  {
    pathname: "/insights/improvement-planning",
    nextHref: PRODUCT_LEARNING_PATH,
  },
  {
    pathname: "/insights/improvement-planning/plans/example-plan",
    nextHref: PLANNING_PATH,
  },
  {
    pathname: "/insights/impact-preview",
    nextHref: REVIEWS_LIST_PATH,
    configureHref: REVIEWS_LIST_PATH,
  },
  {
    pathname: "/insights/patterns",
    nextHref: REVIEWS_NEW_PATH,
  },
  {
    pathname: "/internal/product-learning",
    nextHref: PLANNING_PATH,
  },
];

describe("Category-1 deep-link allowlist (TB-2051)", () => {
  it("exposes working in-app actions for allowlisted hubs", () => {
    for (const row of ALLOWLIST) {
      const entry = contextualHelpForPathname(row.pathname);

      expect(entry, row.pathname).not.toBeNull();

      const nextHref = entry?.whatToDoNextAction?.href ?? null;
      const configureHref = entry?.whereToConfigureAction?.href ?? null;

      expect(
        nextHref != null || configureHref != null,
        `${row.pathname} needs at least one Category-1 action`,
      ).toBe(true);

      if (row.nextHref != null) {
        expect(nextHref, `${row.pathname} whatToDoNextAction`).toBe(row.nextHref);
      }

      if (row.configureHref != null) {
        expect(configureHref, `${row.pathname} whereToConfigureAction`).toBe(row.configureHref);
      }
    }
  });
});
