import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ALERT_RULES_LIST_EMPTY_BODY,
  ALERT_RULES_LIST_EMPTY_TITLE,
  ALERT_RULES_LIST_HEADING,
  ALERT_RULES_POSTURE_NOT_CONFIGURED_LABEL,
  ALERT_RULES_SECTION_HEADING,
  ALERT_RULES_TAB_LABEL,
} from "@/lib/alert-rule-conditions-copy";

describe("alert-rule-conditions-copy", () => {
  it("keeps alert-rule noun alignment across tab, section, and empty titles", () => {
    expect(ALERT_RULES_TAB_LABEL).toBe("Conditions");
    expect(ALERT_RULES_SECTION_HEADING).toBe(ALERT_RULES_TAB_LABEL);
    expect(ALERT_RULES_LIST_HEADING).toBe("Configured alert rules");
    expect(ALERT_RULES_LIST_EMPTY_TITLE).toBe("No alert rules yet");
    expect(ALERT_RULES_POSTURE_NOT_CONFIGURED_LABEL).toBe("No conditions configured");
  });

  it("avoids positional empty-state copy that references controls outside the empty region", () => {
    expect(ALERT_RULES_LIST_EMPTY_BODY).not.toMatch(/\bbelow\b/i);
    expect(ALERT_RULES_LIST_EMPTY_BODY).not.toMatch(/Create a rule below/i);
  });

  it("keeps hub tab config and content module on canonical alert-rule labels", () => {
    const hubSource = readFileSync(
      join(process.cwd(), "src", "app", "(operator)", "governance", "alert-rules", "AlertRulesHubClient.tsx"),
      "utf8",
    );
    const contentSource = readFileSync(
      join(process.cwd(), "src", "components", "alerts", "AlertRulesContent.tsx"),
      "utf8",
    );

    expect(hubSource).toContain("ALERT_RULES_TAB_LABEL");
    expect(contentSource).toContain("ALERT_RULES_LIST_HEADING");
    expect(contentSource).not.toMatch(/>\s*Alert conditions\s*</);
  });
});
