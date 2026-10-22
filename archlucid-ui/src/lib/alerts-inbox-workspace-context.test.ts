import { describe, expect, it } from "vitest";

import {
  buildAlertsInboxEmptyStateProps,
  countAlertsConfigureRulesAffordances,
  resolveAlertsInboxEmptyVariant,
  resolveAlertsOpenReviewPackagesHref,
  shouldShowAlertsHeaderConfigureRulesLink,
  type AlertsInboxEmptyVariant,
} from "@/lib/alerts-inbox-workspace-context";
import {
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
  ALERTS_EMPTY_HEALTHY_TITLE,
  ALERTS_EMPTY_NO_REVIEWS_TITLE,
  ALERTS_EMPTY_NO_RULES_BODY,
  ALERTS_EMPTY_NO_RULES_TITLE,
} from "@/lib/alerts-page-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

const ALL = "__all__";
const RULES_HREF = governanceAlertRulesTabHref("rules");

describe("resolveAlertsInboxEmptyVariant", () => {
  it("prefers no_rules when rules are absent", () => {
    expect(
      resolveAlertsInboxEmptyVariant({ hasReviews: true, hasAlertRules: false, loading: false }, "Open", ALL),
    ).toBe("no_rules");
  });

  it("uses no_reviews when rules exist but reviews do not", () => {
    expect(
      resolveAlertsInboxEmptyVariant({ hasReviews: false, hasAlertRules: true, loading: false }, "Open", ALL),
    ).toBe("no_reviews");
  });

  it("uses healthy_clear when reviews and rules exist", () => {
    expect(
      resolveAlertsInboxEmptyVariant({ hasReviews: true, hasAlertRules: true, loading: false }, "Open", ALL),
    ).toBe("healthy_clear");
  });

  it("uses filtered variant for non-open status filters", () => {
    expect(
      resolveAlertsInboxEmptyVariant({ hasReviews: false, hasAlertRules: false, loading: false }, "Acknowledged", ALL),
    ).toBe("filtered");
  });
});

describe("shouldShowAlertsHeaderConfigureRulesLink", () => {
  it("keeps the header link while workspace context is loading", () => {
    expect(
      shouldShowAlertsHeaderConfigureRulesLink(
        { hasReviews: false, hasAlertRules: false, loading: true },
        "Open",
        ALL,
      ),
    ).toBe(true);
  });

  it("hides the header link only for no_rules", () => {
    expect(
      shouldShowAlertsHeaderConfigureRulesLink(
        { hasReviews: true, hasAlertRules: false, loading: false },
        "Open",
        ALL,
      ),
    ).toBe(false);
  });

  it("shows the header link for healthy_clear, no_reviews, and filtered", () => {
    expect(
      shouldShowAlertsHeaderConfigureRulesLink(
        { hasReviews: true, hasAlertRules: true, loading: false },
        "Open",
        ALL,
      ),
    ).toBe(true);
    expect(
      shouldShowAlertsHeaderConfigureRulesLink(
        { hasReviews: false, hasAlertRules: true, loading: false },
        "Open",
        ALL,
      ),
    ).toBe(true);
    expect(
      shouldShowAlertsHeaderConfigureRulesLink(
        { hasReviews: true, hasAlertRules: true, loading: false },
        "Acknowledged",
        ALL,
      ),
    ).toBe(true);
  });
});

describe("resolveAlertsOpenReviewPackagesHref", () => {
  it("TB-1598: omits projectId=default when session scope resolves to the authority default slug", () => {
    expect(resolveAlertsOpenReviewPackagesHref(null)).toBe("/architecture/reviews");
    expect(resolveAlertsOpenReviewPackagesHref("33333333-3333-3333-3333-333333333333")).toBe("/architecture/reviews");
  });

  it("TB-1598: adds projectId when session scope has a real reviews list slug", () => {
    expect(resolveAlertsOpenReviewPackagesHref("claims-intake")).toBe(
      "/architecture/reviews?projectId=claims-intake",
    );
  });
});

describe("buildAlertsInboxEmptyStateProps", () => {
  it("TB-1598: never emits projectId=default in Open reviews empty actions", () => {
    for (const variant of ["healthy_clear", "filtered"] as const) {
      const props = buildAlertsInboxEmptyStateProps(variant, true);
      const hrefs = props.actions?.map((action) => action.href).join(" ") ?? "";

      expect(hrefs).not.toContain("projectId=default");
    }
  });

  it("maps healthy_clear to open reviews CTA without a configure-rules duplicate", () => {
    const props = buildAlertsInboxEmptyStateProps("healthy_clear", true);
    expect(props.title).toBe(ALERTS_EMPTY_HEALTHY_TITLE);
    expect(props.actions?.[0]?.label).toBe("Open reviews");
    expect(props.actions?.[0]?.href).toBe("/architecture/reviews");
    expect(props.actions?.some((action) => action.href === RULES_HREF)).toBe(false);
  });

  it("maps no_rules to approval setup primary and configure rules secondary", () => {
    const props = buildAlertsInboxEmptyStateProps("no_rules", true);
    expect(props.title).toBe(ALERTS_EMPTY_NO_RULES_TITLE);
    expect(props.description).toBe(ALERTS_EMPTY_NO_RULES_BODY);
    expect(props.description).toContain("critical and high-severity finding count");
    expect(props.actions?.[0]?.label).toBe("Open approval setup");
    expect(props.actions?.[0]?.href).toBe("/governance/setup");
    expect(props.actions?.[1]?.label).toBe(ALERTS_CONFIGURE_RULES_LINK_LABEL);
    expect(props.actions?.[1]?.href).toBe(RULES_HREF);
  });

  it("maps no_reviews to start architecture review CTA", () => {
    const props = buildAlertsInboxEmptyStateProps("no_reviews", true);
    expect(props.title).toBe(ALERTS_EMPTY_NO_REVIEWS_TITLE);
    expect(props.actions?.[0]?.label).toBe("Start architecture review");
  });
});

describe("countAlertsConfigureRulesAffordances (TB-2103)", () => {
  const variants: AlertsInboxEmptyVariant[] = ["no_rules", "no_reviews", "filtered", "healthy_clear"];

  it.each([true, false])(
    "keeps exactly one configure-rules affordance per variant when capability=%s",
    (canMutate) => {
      for (const variant of variants) {
        const showHeader = variant !== "no_rules";
        expect(countAlertsConfigureRulesAffordances(variant, canMutate, showHeader)).toBe(1);
      }
    },
  );
});
