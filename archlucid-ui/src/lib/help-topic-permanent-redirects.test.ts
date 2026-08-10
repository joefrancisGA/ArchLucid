import { describe, expect, it } from "vitest";

import { DATA_HANDLING_TENANT_ISOLATION_HELP_PATH } from "@/lib/data-handling-tenant-isolation-help-route";
import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help-topic-permanent-redirects";
import { AZURE_BOARDS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-azure-boards-help";
import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";

describe("help-topic-permanent-redirects", () => {
  it("redirects retired creating-runs bookmarks to review-guide", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe(REVIEW_GUIDE_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("review-guide")).toBeNull();
  });

  it("redirects data-handling-tenant-isolation alias to canonical data-handling", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["data-handling-tenant-isolation"]).toBe(
      DATA_HANDLING_TENANT_ISOLATION_HELP_PATH,
    );
    expect(resolveHelpTopicPermanentRedirect("data-handling-tenant-isolation")).toBe(
      DATA_HANDLING_TENANT_ISOLATION_HELP_PATH,
    );
    expect(resolveHelpTopicPermanentRedirect("data-handling")).toBeNull();
  });

  it("redirects integrations/azure-boards alias to canonical azure-boards help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["integrations/azure-boards"]).toBe(AZURE_BOARDS_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("integrations/azure-boards")).toBe(AZURE_BOARDS_HELP_TRAFFIC_PATH);
    expect(resolveHelpTopicPermanentRedirect("azure-boards")).toBeNull();
  });

  it("redirects operator-auth-roles alias to canonical users-and-roles help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["operator-auth-roles"]).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
    expect(resolveHelpTopicPermanentRedirect("users-and-roles")).toBeNull();
  });
});
