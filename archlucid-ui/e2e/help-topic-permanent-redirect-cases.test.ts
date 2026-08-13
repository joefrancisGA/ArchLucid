import { describe, expect, it } from "vitest";

import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help/help-topic-permanent-redirects";

import {
  buildHelpTopicPermanentRedirectCases,
  helpTopicRedirectUrlMatches,
} from "./help-topic-permanent-redirect-cases";

describe("help-topic-permanent-redirect-cases (Batch S)", () => {
  it("mirrors every HELP_TOPIC_PERMANENT_REDIRECTS slug", () => {
    const cases = buildHelpTopicPermanentRedirectCases();

    expect(cases.map((entry) => entry.slug).sort()).toEqual(Object.keys(HELP_TOPIC_PERMANENT_REDIRECTS).sort());
  });

  it("parses hash targets for how-it-works and product-overview bookmarks", () => {
    const cases = buildHelpTopicPermanentRedirectCases();
    const howItWorks = cases.find((entry) => entry.slug === "how-it-works");
    const productOverview = cases.find((entry) => entry.slug === "product-overview");

    expect(howItWorks?.targetPath).toBe("/help/getting-started");
    expect(howItWorks?.targetHash).toBe("#how-archlucid-works");
    expect(productOverview?.targetPath).toBe("/help/executive-summary");
    expect(productOverview?.targetHash).toBe("#what-archlucid-is");
  });

  it("matches pathname and hash in redirect URL helper", () => {
    const howItWorks = buildHelpTopicPermanentRedirectCases().find((entry) => entry.slug === "how-it-works");

    expect(howItWorks).toBeDefined();

    expect(
      helpTopicRedirectUrlMatches(
        "http://127.0.0.1:3000/help/getting-started#how-archlucid-works",
        howItWorks!,
      ),
    ).toBe(true);
    expect(
      helpTopicRedirectUrlMatches("http://127.0.0.1:3000/help/getting-started", howItWorks!),
    ).toBe(false);
  });
});
