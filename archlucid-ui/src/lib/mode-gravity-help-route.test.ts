import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import { MODE_GRAVITY_HELP_WHICH_MODE_SLUG } from "@/lib/mode-gravity-help-which-mode-guide-content";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";

const UI_ROOT = join(process.cwd());

describe("mode-gravity help which-mode-am-i-in (MG-012)", () => {
  it("uses canonical /help path and slug", () => {
    expect(MODE_GRAVITY_HELP_WHICH_MODE_PATH).toBe("/help/which-mode-am-i-in");
    expect(MODE_GRAVITY_HELP_WHICH_MODE_SLUG).toBe("which-mode-am-i-in");
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("which-mode-am-i-in");
  });

  it("routes slug through HelpWhichModeAmIInGuideView", () => {
    const resolverSource = readFileSync(
      join(UI_ROOT, "src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain('loaded.entry.slug === "which-mode-am-i-in"');
    expect(resolverSource).toContain("HelpWhichModeAmIInGuideView");
  });

  it("indexes help search catalog topics for which-mode aliases", () => {
    const catalogSource = readFileSync(
      join(UI_ROOT, "src/lib/help/help-search-panel-catalog-topics.ts"),
      "utf8",
    );

    expect(catalogSource).toContain("which-mode-am-i-in");
    expect(catalogSource).toContain("which mode");
  });
});
