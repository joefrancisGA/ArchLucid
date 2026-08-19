import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_HELP_IA_DUAL_INBOUND_LABEL,
  DATA_HANDLING_HELP_JOB_MATRIX,
  DATA_HANDLING_TENANT_ISOLATION_RETIRED_SLUG,
} from "@/lib/data-handling-help-ia-dual";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE } from "@/lib/data-handling-tenant-isolation-help-guide-content";
import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help/help-topic-permanent-redirects";

describe("data-handling help IA dual (TB-1652)", () => {
  it("declares a distinct job split between data-handling orientation and security-trust assurance", () => {
    const current = DATA_HANDLING_HELP_JOB_MATRIX.find((row) => row.isCurrent === true);
    const securityTrustSibling = DATA_HANDLING_HELP_JOB_MATRIX.find((row) => row.isCurrent !== true);

    expect(current?.label.toLowerCase()).toContain("data handling");
    expect(securityTrustSibling?.label).toBe("Security and trust");
    expect(securityTrustSibling?.href).toBe("/help/security-trust");
    expect(securityTrustSibling?.label).not.toBe(current?.label);
  });

  it("uses a distinct inbound label from the page title for security-trust cross-links", () => {
    expect(DATA_HANDLING_HELP_IA_DUAL_INBOUND_LABEL).toBe(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE);
  });

  it("omits retired data-handling-tenant-isolation from the registry without redirects", () => {
    expect(resolveHelpTopicPermanentRedirect(DATA_HANDLING_TENANT_ISOLATION_RETIRED_SLUG)).toBeNull();
    expect(HELP_TOPIC_PERMANENT_REDIRECTS[DATA_HANDLING_TENANT_ISOLATION_RETIRED_SLUG]).toBeUndefined();
  });
});
