import { describe, expect, it } from "vitest";

import {
  PERSONA_SHELL_HANDOFF_LINK,
  PERSONA_SHELL_LABELS,
  PERSONA_SHELL_OPEN_IN_ARCHITECT_VIEW,
  PERSONA_SHELL_WORKSPACE_LABEL,
  PERSONA_SHELL_WORKSPACE_MAP_LABEL,
} from "@/lib/persona-shell-vocabulary";

describe("persona-shell-vocabulary", () => {
  it("uses Architect as the customer-facing working persona label", () => {
    expect(PERSONA_SHELL_LABELS.architect).toBe("Architect");
    expect(PERSONA_SHELL_LABELS.executive).toBe("Executive");
    expect(PERSONA_SHELL_HANDOFF_LINK).toContain("Architect");
    expect(PERSONA_SHELL_OPEN_IN_ARCHITECT_VIEW.toLowerCase()).toContain("architect");
    expect(PERSONA_SHELL_WORKSPACE_LABEL).toContain("Architect");
    expect(PERSONA_SHELL_WORKSPACE_MAP_LABEL).toContain("Architect");
  });

  it("does not expose Operator as a persona label", () => {
    expect(PERSONA_SHELL_LABELS.architect).not.toBe("Operator");
    expect(PERSONA_SHELL_HANDOFF_LINK).not.toContain("Operator");
  });
});
