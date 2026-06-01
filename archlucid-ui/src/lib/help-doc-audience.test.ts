import { describe, expect, it } from "vitest";

import { helpDocPathAudience, isHelpDocPathInDefaultOperatorSearch } from "@/lib/help-doc-audience";

describe("help-doc-audience", () => {
  it("maps engineering runbook paths to developer audience", () => {
    expect(helpDocPathAudience("docs/runbooks/TROUBLESHOOTING.md")).toBe("developer");
    expect(isHelpDocPathInDefaultOperatorSearch("docs/runbooks/TROUBLESHOOTING.md")).toBe(false);
  });

  it("maps operator troubleshooting paths to operator audience", () => {
    expect(helpDocPathAudience("docs/library/customer-facing/OPERATOR_TROUBLESHOOTING.md")).toBe("operator");
    expect(isHelpDocPathInDefaultOperatorSearch("docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md")).toBe(true);
  });
});
