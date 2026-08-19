import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_CHOOSER_HELP_BANNED_VISIBLE_COPY_PATTERNS,
  acceleratorChooserHelpCopyContainsBannedPattern,
} from "@/lib/accelerator-chooser-help-banned-copy";

describe("accelerator-chooser-help-banned-copy", () => {
  it("exports shared banned patterns for help tests", () => {
    expect(ACCELERATOR_CHOOSER_HELP_BANNED_VISIBLE_COPY_PATTERNS.length).toBeGreaterThan(0);
    expect(acceleratorChooserHelpCopyContainsBannedPattern("core pilot walkthrough")).toHaveLength(1);
    expect(acceleratorChooserHelpCopyContainsBannedPattern("sealed review record")).toHaveLength(0);
  });
});
