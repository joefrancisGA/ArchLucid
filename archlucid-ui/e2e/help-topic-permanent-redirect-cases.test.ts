import { describe, expect, it } from "vitest";

import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help/help-topic-permanent-redirects";

import {
  buildHelpTopicPermanentRedirectCases,
  helpTopicRedirectUrlMatches,
} from "./help-topic-permanent-redirect-cases";

describe("help-topic-permanent-redirect-cases (Batch S)", () => {
  it("mirrors empty HELP_TOPIC_PERMANENT_REDIRECTS", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS).toEqual({});
    expect(buildHelpTopicPermanentRedirectCases()).toEqual([]);
  });

  it("matches pathname and hash in redirect URL helper", () => {
    const sample = {
      slug: "how-it-works",
      retiredPath: "/help/how-it-works",
      targetPath: "/help/getting-started",
      targetHash: "#how-archlucid-works",
    };

    expect(
      helpTopicRedirectUrlMatches(
        "http://127.0.0.1:3000/help/getting-started#how-archlucid-works",
        sample,
      ),
    ).toBe(true);
    expect(helpTopicRedirectUrlMatches("http://127.0.0.1:3000/help/getting-started", sample)).toBe(false);
  });
});
