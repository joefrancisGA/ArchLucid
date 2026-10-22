import { describe, expect, it } from "vitest";

import {
  formatHelpFollowUpLinkAccessibleName,
  isInAppHelpFollowUpHref,
} from "@/lib/help/help-follow-up-link-label";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("help-follow-up-link-label", () => {
  it("detects in-app help hrefs", () => {
    expect(isInAppHelpFollowUpHref(inAppHelpHref("integration-readiness"))).toBe(true);
    expect(isInAppHelpFollowUpHref("/integrations/jira")).toBe(false);
  });

  it("prefixes help and product destinations for follow-up links", () => {
    expect(formatHelpFollowUpLinkAccessibleName(inAppHelpHref("integration-readiness"), "Integration readiness help")).toBe(
      "Read Integration readiness help",
    );
    expect(formatHelpFollowUpLinkAccessibleName("/integrations/jira", "Jira integration")).toBe("Open Jira integration");
  });

  it("does not double-prefix labels that already include Read or Open", () => {
    expect(formatHelpFollowUpLinkAccessibleName("/help/alerts", "Read alerts help")).toBe("Read alerts help");
    expect(formatHelpFollowUpLinkAccessibleName("/governance/audit", "Open Audit trail")).toBe("Open Audit trail");
  });
});
