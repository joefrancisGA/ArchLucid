import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO,
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH,
} from "@/lib/buyer/buyer-polish-copy";

describe("buyer-polish-copy — home architecture lifecycle", () => {
  it("frames create and review cards as sequential lifecycle steps", () => {
    expect(OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE).toMatch(/^Step 1 —/);
    expect(OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE).toMatch(/^Step 2 —/);
    expect(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO).toBe(
      "One lifecycle: Start from a description, uploaded evidence, or live cloud inventory—then run a governed review. The review is the durable work item.",
    );
    expect(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO.startsWith("One lifecycle:")).toBe(true);
    expect(OPERATOR_HOME_COMMAND_CENTER_TAGLINE).not.toMatch(/Create an architecture, review an existing design/i);
    expect(OPERATOR_HOME_INTENT_CHOOSER_HEADING).toContain("lifecycle");
    expect(OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH).not.toMatch(/creation or review path/i);
  });
});
