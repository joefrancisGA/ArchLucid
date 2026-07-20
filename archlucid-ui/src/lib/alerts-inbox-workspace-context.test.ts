import { describe, expect, it } from "vitest";

import {
  buildAlertsInboxEmptyStateProps,
  resolveAlertsInboxEmptyVariant,
} from "@/lib/alerts-inbox-workspace-context";
import {
  ALERTS_EMPTY_HEALTHY_TITLE,
  ALERTS_EMPTY_NO_REVIEWS_TITLE,
  ALERTS_EMPTY_NO_RULES_TITLE,
  ALERTS_ACTION_CONFIGURE_ALERT_RULES,
} from "@/lib/alerts-page-copy";

const ALL = "__all__";

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

describe("buildAlertsInboxEmptyStateProps", () => {
  it("maps healthy_clear to open reviews CTA", () => {
    const props = buildAlertsInboxEmptyStateProps("healthy_clear", true);
    expect(props.title).toBe(ALERTS_EMPTY_HEALTHY_TITLE);
    expect(props.actions?.[0]?.label).toBe("Open reviews");
  });

  it("maps no_rules to configure alert rules CTA", () => {
    const props = buildAlertsInboxEmptyStateProps("no_rules", true);
    expect(props.title).toBe(ALERTS_EMPTY_NO_RULES_TITLE);
    expect(props.actions?.[0]?.label).toBe(ALERTS_ACTION_CONFIGURE_ALERT_RULES);
    expect(props.actions?.[0]?.href).toBe("/governance/alert-rules");
    expect(props.actions?.[1]?.label).toBe("Open governance setup guide");
  });

  it("maps no_reviews to start architecture review CTA", () => {
    const props = buildAlertsInboxEmptyStateProps("no_reviews", true);
    expect(props.title).toBe(ALERTS_EMPTY_NO_REVIEWS_TITLE);
    expect(props.actions?.[0]?.label).toBe("Start architecture review");
  });
});
