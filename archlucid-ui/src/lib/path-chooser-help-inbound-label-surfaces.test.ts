import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PATH_CHOOSER_HELP_INBOUND_LABEL_SOURCE_FILES,
  PATH_CHOOSER_HELP_INBOUND_PATH_LABELS,
} from "@/lib/path-chooser-help-inbound-label-surfaces";
import { PATH_CHOOSER_HELP_TOPIC_LABEL } from "@/lib/path-chooser-help-evidence-copy";
import {
  PATH_CHOOSER_HELP_RELATED_GUIDES,
  pathChooserHelpRelatedGuides,
} from "@/lib/path-chooser-help-related-guides";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

function readInboundLabelSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("path-chooser help inbound labels and Related density (TB-1711, TB-1715)", () => {
  it("maps choose-your-next-step help to the canonical topic label", () => {
    for (const [pathname, expectedLabel] of Object.entries(PATH_CHOOSER_HELP_INBOUND_PATH_LABELS)) {
      expect(pageHelpTopicForPathname(pathname)?.label).toBe(expectedLabel);
    }

    expect(PATH_CHOOSER_HELP_TOPIC_LABEL).toBe("How to choose your next step");
  });

  it("keeps listed inbound surfaces on the canonical path-chooser help topic label", () => {
    for (const relativePath of PATH_CHOOSER_HELP_INBOUND_LABEL_SOURCE_FILES) {
      const source = readInboundLabelSource(relativePath);

      expect(source).toContain("PATH_CHOOSER_HELP_TOPIC_LABEL");
    }
  });

  it("limits Related help to at most three buyer-safe guides", () => {
    const guides = pathChooserHelpRelatedGuides();

    expect(guides).toEqual([...PATH_CHOOSER_HELP_RELATED_GUIDES]);
    expect(guides.length).toBeLessThanOrEqual(3);
    expect(guides.some((guide) => guide.href.includes("/help/choose-your-next-step"))).toBe(false);
  });
});
