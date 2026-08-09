import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS,
} from "@/lib/accelerator-chooser-help-guide-content";

describe("accelerator-chooser-help-guide-content", () => {
  it("uses buyer-facing page title", () => {
    expect(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE).toBe("Pick an accelerator pack");
  });

  it("defines workflow steps with prerequisite first", () => {
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS[0]?.title).toBe("Confirm finalize");
    expect(ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS.length).toBe(4);
  });
});
