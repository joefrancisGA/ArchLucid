import { describe, expect, it } from "vitest";

import {
  helpTopicShellSidebarExpandedGroupIds,
  helpTopicShellSidebarNavHrefs,
  resolveHelpTopicShellSidebarNavConfig,
} from "@/lib/help/help-topic-shell-sidebar-nav-config";

describe("help-topic-shell-sidebar-nav-config", () => {
  it("activates Help and Administration for configuration reference", () => {
    const config = resolveHelpTopicShellSidebarNavConfig("/help/configuration-reference");

    expect(config).not.toBeNull();
    expect(config?.activeNavHrefs).toEqual(["/help", "/administration"]);
    expect(config?.expandedGroupIds).toEqual(["operator-admin"]);
  });

  it("returns empty helpers for unrelated paths", () => {
    expect(helpTopicShellSidebarNavHrefs("/help/getting-started")).toEqual([]);
    expect(helpTopicShellSidebarExpandedGroupIds("/architecture/reviews")).toEqual([]);
  });
});
