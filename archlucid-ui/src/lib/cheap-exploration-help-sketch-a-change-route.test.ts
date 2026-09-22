import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SLUG } from "@/lib/cheap-exploration-help-sketch-a-change-guide-content";

const REPO_ROOT = join(process.cwd(), "..");

describe("cheap-exploration help sketch a change route (CE-019)", () => {
  it("registers slug and resolver wiring", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain(CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SLUG);

    const resolverSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain("HelpSketchAChangeGuideView");
  });
});
