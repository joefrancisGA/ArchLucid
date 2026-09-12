import { describe, expect, it } from "vitest";

import {
  CAREER_REHEARSAL_HELP_DOOR_CARDS,
  CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY,
} from "@/lib/career-rehearsal-help-guide-content";
import {
  CAREER_REHEARSAL_HELP_TOPIC_LABEL,
} from "@/lib/career-rehearsal-help-evidence-copy";
import {
  WORKING_CAREER_REHEARSAL_INTENT_LABELS,
} from "@/lib/governance/working-career-rehearsal-intent";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("career-rehearsal help Working examples (AS-082)", () => {
  it("registers a help topic that names both Record and Practice review types", () => {
    const entry = getProductDocumentationEntry("career-vs-rehearsal");

    expect(entry?.slug).toBe("career-vs-rehearsal");
    expect(entry?.title).toContain("Record");
    expect(entry?.title).toContain("Practice");
    expect(CAREER_REHEARSAL_HELP_TOPIC_LABEL).toContain(WORKING_CAREER_REHEARSAL_INTENT_LABELS.career);
    expect(CAREER_REHEARSAL_HELP_TOPIC_LABEL).toContain(WORKING_CAREER_REHEARSAL_INTENT_LABELS.rehearsal);
  });

  it("describes both review types and states Simulator is not sponsor proof", () => {
    const titles = CAREER_REHEARSAL_HELP_DOOR_CARDS.map((card) => card.title);

    expect(titles).toContain("Record");
    expect(titles).toContain("Practice");
    expect(CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY.toLowerCase()).toContain("simulator");
    expect(CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY.toLowerCase()).toContain("sponsor proof");
  });
});
