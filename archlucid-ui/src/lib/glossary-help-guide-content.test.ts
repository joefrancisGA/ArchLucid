import { describe, expect, it } from "vitest";

import {
  GLOSSARY_HELP_PRIMARY_ACTIONS,
} from "@/lib/glossary-help-guide-content";

describe("glossary-help-guide-content", () => {
  it("wires primary actions to buyer-safe product destinations", () => {
    expect(GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.href).toBe("/architecture/reviews");
    expect(GLOSSARY_HELP_PRIMARY_ACTIONS.openFindingsGuide.href).toBe("/help/findings");
    expect(GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.href).toBe("/help/first-architecture-review");
  });
});
