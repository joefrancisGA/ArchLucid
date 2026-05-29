import { describe, expect, it } from "vitest";

import {
  ASK_BUYER_PROMPT_GROUPS,
  ASK_DEEP_LINK_RUN_PROMPTS,
  ASK_EXAMPLE_PROMPTS,
  buyerAskStarterPromptLines,
} from "./ask-page-constants";

describe("ask page starter prompts", () => {
  it("includes bounded sponsor, approval, priority, and evidence prompts", () => {
    const allPrompts = [
      ...ASK_EXAMPLE_PROMPTS,
      ...ASK_DEEP_LINK_RUN_PROMPTS,
      ...buyerAskStarterPromptLines(),
    ];

    expect(allPrompts).toContain("What should I tell my CTO in the first 90 seconds?");
    expect(allPrompts).toContain("What blocks approval right now?");
    expect(allPrompts).toContain("Which finding should we fix first, and why?");
    expect(allPrompts).toContain("What evidence supports the top finding in this review?");
  });

  it("groups buyer prompts by executive, mitigation, and evidence intent", () => {
    expect(ASK_BUYER_PROMPT_GROUPS.map((group) => group.heading)).toEqual([
      "Executive summary",
      "Mitigation",
      "Evidence",
    ]);
  });
});
