import { describe, expect, it } from "vitest";

import { topicMatchesQuery } from "@/components/help-panel-topic-filter";
import type { HelpTopic } from "@/lib/help/help-topics";

const TOPIC: HelpTopic = {
  id: "mixed-case-keywords",
  title: "Architecture reviews",
  keywords: ["RBAC", "Approval", "Signed Manifest"],
  summary: "Review architecture submissions and evidence.",
  docPath: "docs/library/FIRST_RUN_WIZARD.md",
  routes: ["/architecture/reviews"],
};

describe("topicMatchesQuery", () => {
  it("matches keywords case-insensitively", () => {
    expect(topicMatchesQuery(TOPIC, "rbac")).toBe(true);
    expect(topicMatchesQuery(TOPIC, "govern")).toBe(true);
    expect(topicMatchesQuery(TOPIC, "manifest")).toBe(true);
  });
});
