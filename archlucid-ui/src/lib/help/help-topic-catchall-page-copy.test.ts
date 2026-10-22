import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_CATCHALL_BUYER_OVERVIEW,
  HELP_TOPIC_CATCHALL_BUYER_START_HERE_HELPER,
  HELP_TOPIC_CATCHALL_PAGE_LEAD,
} from "@/lib/help/help-topic-catchall-page-copy";

describe("help-topic-catchall-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(HELP_TOPIC_CATCHALL_BUYER_OVERVIEW).not.toBe(HELP_TOPIC_CATCHALL_PAGE_LEAD);
    expect(HELP_TOPIC_CATCHALL_BUYER_OVERVIEW).not.toBe(HELP_TOPIC_CATCHALL_BUYER_START_HERE_HELPER);
  });
});
