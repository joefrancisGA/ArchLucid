import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import { FIRST_LOGIN_WORKSPACE_HELP_SLUG } from "@/lib/first-login-workspace-help-guide-content";
import { FIRST_LOGIN_WORKSPACE_HELP_PATH } from "@/lib/first-login-workspace-help-route";

const UI_ROOT = join(process.cwd());

describe("first-login-workspace help (LS-015)", () => {
  it("uses canonical /help path and slug", () => {
    expect(FIRST_LOGIN_WORKSPACE_HELP_PATH).toBe("/help/first-login-workspace");
    expect(FIRST_LOGIN_WORKSPACE_HELP_SLUG).toBe("first-login-workspace");
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("first-login-workspace");
  });

  it("routes slug through HelpFirstLoginWorkspaceGuideView", () => {
    const resolverSource = readFileSync(
      join(UI_ROOT, "src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain('loaded.entry.slug === "first-login-workspace"');
    expect(resolverSource).toContain("HelpFirstLoginWorkspaceGuideView");
  });

  it("indexes help search aliases for training mode and not live data", () => {
    const catalogSource = readFileSync(
      join(UI_ROOT, "src/lib/help/help-search-panel-catalog-topics.ts"),
      "utf8",
    );

    expect(catalogSource).toContain("first-login-workspace");
    expect(catalogSource).toContain("training mode");
    expect(catalogSource).toContain("not live data");
  });
});
