import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMPOSITE_RULES_NOUN,
  COMPOSITE_RULES_TAB_LABEL,
  compositeRulesCreateButtonLabelOperator,
  compositeRulesCurrentRulesHeadingOperator,
} from "@/lib/enterprise-controls-context-copy";
import { operatorHubZoneEmptyTitle } from "@/lib/operator/operator-empty-state-kind-presets";

describe("composite rules naming guard (GOA P0-6)", () => {
  it("keeps tab, section, and empty titles on the canonical composite-rules noun", () => {
    expect(COMPOSITE_RULES_TAB_LABEL).toBe("Composite rules");
    expect(compositeRulesCurrentRulesHeadingOperator).toBe(`Current ${COMPOSITE_RULES_NOUN}`);
    expect(operatorHubZoneEmptyTitle(COMPOSITE_RULES_NOUN)).toBe(`No ${COMPOSITE_RULES_NOUN} yet`);
    expect(compositeRulesCreateButtonLabelOperator).toContain("composite rule");
  });

  it("keeps hub tab config and composite panel on canonical composite-rules labels", () => {
    const hubSource = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "governance", "alert-rules", "AlertRulesHubClient.tsx"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "CompositeAlertRulesContent.tsx"),
      "utf8",
    );

    expect(hubSource).toContain("COMPOSITE_RULES_TAB_LABEL");
    expect(contentSource).toContain("compositeRulesCurrentRulesHeadingOperator");
    expect(hubSource).not.toMatch(/label:\s*"Advanced rules"/);
  });
});
