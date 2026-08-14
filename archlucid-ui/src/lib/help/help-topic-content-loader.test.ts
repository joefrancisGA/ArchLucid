import { describe, expect, it } from "vitest";

import {
  HELP_APP_GUIDED_TOPIC_SLUGS,
  isHelpAppGuidedTopicSlug,
  loadHelpTopicContent,
  resolveHelpTopicContentKind,
} from "@/lib/help/help-topic-content-loader";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("help-topic-content-loader (TB-2238)", () => {
  it("classifies app-guided troubleshooting without repo markdown", () => {
    const entry = getProductDocumentationEntry("troubleshooting");

    expect(entry).not.toBeNull();
    expect(resolveHelpTopicContentKind(entry!)).toBe("app-guided");

    const loaded = loadHelpTopicContent("troubleshooting");

    expect(loaded).not.toBeNull();
    expect(loaded!.contentKind).toBe("app-guided");
    expect(loaded!.markdown).toBe("");
  });

  it("classifies markdown topics with layout strips", () => {
    const entry = getProductDocumentationEntry("security-trust");

    expect(entry).not.toBeNull();
    expect(resolveHelpTopicContentKind(entry!)).toBe("markdown-with-layout");
    expect(isHelpAppGuidedTopicSlug("security-trust")).toBe(false);
  });

  it("registers every app-guided slug exactly once", () => {
    const unique = new Set(HELP_APP_GUIDED_TOPIC_SLUGS);

    expect(unique.size).toBe(HELP_APP_GUIDED_TOPIC_SLUGS.length);
  });
});
