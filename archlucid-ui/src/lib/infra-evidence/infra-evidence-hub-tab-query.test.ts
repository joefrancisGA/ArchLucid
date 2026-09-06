import { describe, expect, it } from "vitest";

import { sanitizeResourceHubQueryForTab } from "@/lib/infra-evidence/infra-evidence-hub-tab-query";
import {
  RESOURCE_HUB_CORRESPONDENCE_ID_PARAM,
  RESOURCE_HUB_DIFF_ID_PARAM,
  RESOURCE_HUB_FINDING_ID_PARAM,
  RESOURCE_HUB_INSTANCE_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

describe("infra-evidence-hub-tab-query", () => {
  it("drops item-scoped params when switching hub tabs", () => {
    const currentSearch = new URLSearchParams({
      tab: "findings",
      findingId: "finding-1",
      diffId: "diff-1",
      instanceId: "instance-1",
      correspondenceId: "corr-1",
      runId: "run-1",
    }).toString();

    const driftSearch = sanitizeResourceHubQueryForTab(currentSearch, "drift");

    expect(new URLSearchParams(driftSearch).get(RESOURCE_HUB_DIFF_ID_PARAM)).toBe("diff-1");
    expect(new URLSearchParams(driftSearch).get(RESOURCE_HUB_FINDING_ID_PARAM)).toBeNull();
    expect(new URLSearchParams(driftSearch).get(RESOURCE_HUB_INSTANCE_ID_PARAM)).toBeNull();
    expect(new URLSearchParams(driftSearch).get(RESOURCE_HUB_CORRESPONDENCE_ID_PARAM)).toBeNull();
    expect(new URLSearchParams(driftSearch).get(RESOURCE_HUB_RUN_ID_PARAM)).toBeNull();
  });
});
