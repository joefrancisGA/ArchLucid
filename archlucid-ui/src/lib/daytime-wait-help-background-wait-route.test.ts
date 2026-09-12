import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SLUG } from "@/lib/daytime-wait-help-background-wait-guide-content";
import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";

const REPO_ROOT = join(process.cwd(), "..");

describe("daytime-wait help background wait route (DW-015)", () => {
  it("registers slug and resolver wiring", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SLUG);

    const resolverSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain("HelpBackgroundWaitGuideView");
  });
});
