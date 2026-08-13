import { describe, expect, it } from "vitest";

import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

describe("page-help-topic-map — policy packs", () => {
  it("maps Policy packs and Standards & rules to their help topics", () => {
    expect(pageHelpTopicForPathname("/governance/policy-packs")?.slug).toBe("policy-packs");
    expect(pageHelpTopicForPathname("/governance/policy-packs")?.label).toBe("Policy packs");
    expect(pageHelpTopicForPathname("/governance/policy-packs/pack-1")?.slug).toBe("policy-packs");
    expect(pageHelpTopicForPathname("/governance/standards-and-rules")?.slug).toBe("standards-and-rules");
    expect(pageHelpTopicForPathname("/governance/standards-and-rules")?.label).toBe("How standards & rules work");
    // Legacy /policy-packs bookmark canonicalizes to /governance/policy-packs (same help topic).
    expect(pageHelpTopicForPathname("/policy-packs")?.slug).toBe("policy-packs");
  });
});
