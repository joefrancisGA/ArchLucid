import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES } from "@/lib/operator/operator-integrations-page-help-surfaces";
import { isGenericLearnMoreSlug } from "@/lib/learn-more-job-match-inventory";
import { CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL } from "@/lib/cloud-provider-connection-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } from "@/lib/cloud-connections-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-aws-securely-help-evidence-copy";
import { CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { PATTERN_LIBRARY_HELP_TOPIC_LABEL } from "@/lib/pattern-library-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const SRC_ROOT = join(process.cwd(), "src");

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("operator-integrations-page-help-surfaces (TB-1669)", () => {
  it("tracks every TB-1669 named surface", () => {
    expect(OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES.map((entry) => entry.id)).toEqual([
      "integrations-cloud-connections",
      "integrations-cloud-connections-azure",
      "integrations-cloud-connections-aws",
      "integrations-cloud-connections-gcp",
      "integrations-jira",
      "integrations-servicenow",
      "integrations-azure-boards",
      "integrations-teams",
      "integrations-slack",
      "integrations-webhooks",
      "integrations-atlassian-oauth-callback",
      "administration-connection-status",
      "internal-product-learning",
      "insights-patterns",
      "insights-patterns-detail",
      "internal-health",
    ]);
  });

  it.each(
    OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES.map((entry) => [
      entry.id,
      entry.pathname,
      entry.modulePath,
    ]),
  )("%s resolves a page help topic for %s", (_id, pathname) => {
    const topic = pageHelpTopicForPathname(pathname);

    expect(topic).not.toBeNull();
    expect(topic?.label?.length).toBeGreaterThan(0);
  });

  it.each(
    OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES.map((entry) => [
      entry.id,
      entry.modulePath,
    ]),
  )("%s mounts PageContextualHelpButton", (_id, modulePath) => {
    const source = readSrcModule(modulePath);

    expect(source).toContain("PageContextualHelpButton");
  });

  it("Azure cloud detail page-help opens Connect Azure securely first (TB-1768)", () => {
    const topic = pageHelpTopicForPathname("/integrations/cloud-connections/azure");

    expect(topic?.slug).toBe("cloud-connections-azure");
    expect(inAppHelpHref(topic!.slug)).toBe("/help/cloud-connections/azure");
    expect(inAppHelpHref(topic!.slug)).not.toBe("/help/azure-permissions");
  });

  it("cloud provider children map to provider-specific topics (TB-1669)", () => {
    expect(pageHelpTopicForPathname("/integrations/cloud-connections/azure")?.slug).toBe("cloud-connections-azure");
    expect(pageHelpTopicForPathname("/integrations/cloud-connections/azure")?.label).toBe(CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/integrations/cloud-connections/aws")?.slug).toBe("cloud-connections-aws");
    expect(pageHelpTopicForPathname("/integrations/cloud-connections/aws")?.label).toBe(CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/integrations/cloud-connections/gcp")?.slug).toBe("cloud-connections-gcp");
    expect(pageHelpTopicForPathname("/integrations/cloud-connections/gcp")?.label).toBe(CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL);
    expect(pageHelpTopicForPathname("/integrations/cloud-connections")?.slug).toBe("cloud-connections");
    expect(pageHelpTopicForPathname("/integrations/cloud-connections")?.label).toBe(CLOUD_CONNECTIONS_HELP_TOPIC_LABEL);
  });

  it("integration product pages map to integration-readiness or product topics (TB-1669)", () => {
    expect(pageHelpTopicForPathname("/integrations/jira")?.slug).toBe("jira-integration");
    expect(pageHelpTopicForPathname("/integrations/servicenow")?.slug).toBe("servicenow-integration");
    expect(pageHelpTopicForPathname("/integrations/azure-boards")?.slug).toBe("azure-boards");
    expect(pageHelpTopicForPathname("/administration/connection-status")?.slug).toBe("connection-status");
    expect(pageHelpTopicForPathname("/internal/product-learning")?.slug).toBe("pilot-feedback");
    expect(pageHelpTopicForPathname("/internal/health")?.slug).toBe("admin-diagnostics");
  });

  it("pattern library maps to repeat-review-loop help on hub and detail (TB-1814)", () => {
    const hubTopic = pageHelpTopicForPathname("/insights/patterns");
    const detailTopic = pageHelpTopicForPathname("/insights/patterns/api-gateway-bff");

    expect(hubTopic?.label).toBe(PATTERN_LIBRARY_HELP_TOPIC_LABEL);
    expect(hubTopic?.slug).toBe("repeat-review-loop");
    expect(detailTopic?.slug).toBe("repeat-review-loop");
    expect(isGenericLearnMoreSlug(hubTopic?.slug)).toBe(false);
  });
});
