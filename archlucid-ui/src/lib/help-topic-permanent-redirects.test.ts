import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help-topic-permanent-redirects";

describe("help-topic-permanent-redirects", () => {
  it("redirects retired creating-runs bookmarks to review-guide", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("review-guide")).toBeNull();
  });

  it("redirects data-handling-tenant-isolation alias to canonical data-handling", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["data-handling-tenant-isolation"]).toBe("/help/data-handling");
    expect(resolveHelpTopicPermanentRedirect("data-handling-tenant-isolation")).toBe("/help/data-handling");
    expect(resolveHelpTopicPermanentRedirect("data-handling")).toBeNull();
  });

  it("redirects integrations/azure-boards alias to canonical azure-boards help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["integrations/azure-boards"]).toBe("/help/azure-boards");
    expect(resolveHelpTopicPermanentRedirect("integrations/azure-boards")).toBe("/help/azure-boards");
    expect(resolveHelpTopicPermanentRedirect("azure-boards")).toBeNull();
  });

  it("redirects operator-auth-roles alias to canonical users-and-roles help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["operator-auth-roles"]).toBe("/help/users-and-roles");
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe("/help/users-and-roles");
    expect(resolveHelpTopicPermanentRedirect("users-and-roles")).toBeNull();
  });
});
