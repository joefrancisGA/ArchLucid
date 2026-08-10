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

  it("redirects Batch A retired help aliases to canonical topics", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["starting-reviews"]).toBe("/help/review-guide");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["evidence-only-review"]).toBe("/help/first-architecture-review");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["product-overview"]).toBe("/help/executive-summary#what-archlucid-is");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["core-pilot"]).toBe("/help/first-architecture-review");
    expect(resolveHelpTopicPermanentRedirect("starting-reviews")).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("evidence-only-review")).toBe("/help/first-architecture-review");
    expect(resolveHelpTopicPermanentRedirect("product-overview")).toBe("/help/executive-summary#what-archlucid-is");
    expect(resolveHelpTopicPermanentRedirect("core-pilot")).toBe("/help/first-architecture-review");
  });

  it("redirects how-it-works alias to getting-started How ArchLucid works anchor", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["how-it-works"]).toBe("/help/getting-started#how-archlucid-works");
    expect(resolveHelpTopicPermanentRedirect("how-it-works")).toBe("/help/getting-started#how-archlucid-works");
    expect(resolveHelpTopicPermanentRedirect("getting-started")).toBeNull();
  });
});
