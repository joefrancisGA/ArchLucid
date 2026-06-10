import { describe, expect, it } from "vitest";

import {
  CTO_DEMO_DEFAULT_STORY_ID,
  CTO_DEMO_STORIES,
  findCtoDemoStory,
} from "@/lib/buyer-cto-demo-story-registry";

describe("buyer-cto-demo-story-registry", () => {
  it("defines four vertical stories", () => {
    expect(CTO_DEMO_STORIES).toHaveLength(4);
  });

  it("findCtoDemoStory returns the matching story", () => {
    expect(findCtoDemoStory("fintech").label).toBe("FinTech");
  });

  it("findCtoDemoStory falls back to default for unknown ids", () => {
    expect(findCtoDemoStory("unknown").id).toBe(CTO_DEMO_DEFAULT_STORY_ID);
  });
});
