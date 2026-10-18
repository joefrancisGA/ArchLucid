import { afterEach, describe, expect, it } from "vitest";

import {
  readRemediationPatternImportPanelOpenFromSession,
  REMEDIATION_PATTERN_IMPORT_PANEL_SESSION_KEY,
  writeRemediationPatternImportPanelOpenToSession,
} from "@/lib/remediation-pattern-import-panel-session";

describe("remediation-pattern-import-panel-session", () => {
  afterEach(() => {
    window.sessionStorage.removeItem(REMEDIATION_PATTERN_IMPORT_PANEL_SESSION_KEY);
  });

  it("persists import panel open state in sessionStorage", () => {
    expect(readRemediationPatternImportPanelOpenFromSession()).toBe(false);

    writeRemediationPatternImportPanelOpenToSession(true);

    expect(readRemediationPatternImportPanelOpenFromSession()).toBe(true);

    writeRemediationPatternImportPanelOpenToSession(false);

    expect(readRemediationPatternImportPanelOpenFromSession()).toBe(false);
  });
});
