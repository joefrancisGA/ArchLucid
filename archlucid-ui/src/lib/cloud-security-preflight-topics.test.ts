import { describe, expect, it } from "vitest";

import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("cloudSecurityPreflightTopics", () => {
  it("routes AWS federation and least-privilege citations to AWS help", () => {
    const topics = cloudSecurityPreflightTopics("aws");
    const federation = topics.find((topic) => topic.id === "identity-federation");
    const roleTrust = topics.find((topic) => topic.id === "aws-role-trust");
    const leastPrivilege = topics.find((topic) => topic.id === "least-privilege");

    expect(federation?.trustCenterControl.href).toBe(inAppHelpHref("cloud-connections-aws"));
    expect(federation?.trustCenterControl.label).toContain("AWS");
    expect(roleTrust?.trustCenterControl.href).toBe(inAppHelpHref("cloud-connections-aws"));
    expect(leastPrivilege?.trustCenterControl.href).toBe(inAppHelpHref("cloud-connections-aws"));
    expect(federation?.trustCenterControl.href).not.toBe(inAppHelpHref("cloud-connections-azure"));
    expect(federation?.trustCenterControl.label).not.toContain("workload identity federation");
  });

  it("routes GCP federation citations to GCP help", () => {
    const topics = cloudSecurityPreflightTopics("gcp");
    const federation = topics.find((topic) => topic.id === "identity-federation");
    const wifBinding = topics.find((topic) => topic.id === "gcp-wif-binding");

    expect(federation?.trustCenterControl.href).toBe(inAppHelpHref("cloud-connections-gcp"));
    expect(wifBinding?.trustCenterControl.href).toBe(inAppHelpHref("cloud-connections-gcp"));
    expect(federation?.trustCenterControl.href).not.toBe(inAppHelpHref("cloud-connections-azure"));
  });

  it("keeps Azure permissions help on Azure least-privilege topics", () => {
    const topics = cloudSecurityPreflightTopics("azure");
    const leastPrivilege = topics.find((topic) => topic.id === "least-privilege");
    const subscriptionScope = topics.find((topic) => topic.id === "azure-subscription-scope");

    expect(leastPrivilege?.trustCenterControl.href).toBe(inAppHelpHref("azure-permissions"));
    expect(subscriptionScope?.trustCenterControl.href).toBe(inAppHelpHref("azure-permissions"));
  });
});
