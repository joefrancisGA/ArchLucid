import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_INBOUND_LABEL_SOURCE_FILES,
  PRIOR_MANIFEST_RETRIEVAL_HELP_INBOUND_PATH_LABELS,
} from "@/lib/prior-manifest-retrieval-help-inbound-label-surfaces";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES,
  priorManifestRetrievalHelpRelatedGuides,
} from "@/lib/prior-manifest-retrieval-help-related-guides";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("prior-manifest retrieval help inbound labels and Related density (TB-1732, TB-1735)", () => {
  it("maps prior-manifest help to the canonical Ask-memory topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(PRIOR_MANIFEST_RETRIEVAL_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL).toBe("How Ask memory from finalized reviews works");
  });

  it("keeps listed inbound surfaces on the canonical prior-manifest help topic label", () => {
    for (const relativePath of PRIOR_MANIFEST_RETRIEVAL_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL");
    }
  });

  it("uses Ask memory guide on finalize success inbound copy", () => {
    const commitRunButtonSource = readInboundLabelSource("src/components/CommitRunButton.tsx");

    expect(commitRunButtonSource).toContain("PRIOR_MANIFEST_RETRIEVAL_HELP_FINALIZE_SUCCESS_LINK_LABEL");
    expect(commitRunButtonSource.toLowerCase()).not.toContain("prior manifest guide");
  });

  it("limits Related help to at most three buyer-safe guides", () => {
    const guides = priorManifestRetrievalHelpRelatedGuides();

    expect(guides).toEqual([...PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);
    expect(guides.some((guide) => guide.href.includes("/help/prior-manifest-retrieval"))).toBe(false);
  });
});
