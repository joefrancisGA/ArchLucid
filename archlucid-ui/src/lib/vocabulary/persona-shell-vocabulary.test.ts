import { describe, expect, it } from "vitest";

import {
  PERSONA_SHELL_HANDOFF_LINK,
  PERSONA_SHELL_LABELS,
  PERSONA_SHELL_OPEN_IN_ARCHITECT_VIEW,
  PERSONA_SHELL_DEFAULT_DOCUMENT_TITLE,
  PERSONA_SHELL_SIGN_OUT_HOME_ARIA_LABEL,
  PERSONA_SHELL_WORDMARK_ARIA_LABEL,
  PERSONA_SHELL_WORKSPACE_LABEL,
  PERSONA_SHELL_WORKSPACE_MAP_LABEL,
} from "@/lib/vocabulary/persona-shell-vocabulary";

describe("persona-shell-vocabulary", () => {
  it("uses Architect as the customer-facing working persona label", () => {
    expect(PERSONA_SHELL_LABELS.architect).toBe("Architect");
    expect(PERSONA_SHELL_LABELS.sponsor).toBe("Sponsor");
    expect(PERSONA_SHELL_HANDOFF_LINK).toContain("Architect");
    expect(PERSONA_SHELL_OPEN_IN_ARCHITECT_VIEW.toLowerCase()).toContain("architect");
    expect(PERSONA_SHELL_WORKSPACE_LABEL).toContain("Architect");
    expect(PERSONA_SHELL_WORKSPACE_MAP_LABEL).toContain("Architect");
  });

  it("does not expose Operator as a persona label", () => {
    expect(PERSONA_SHELL_LABELS.architect).not.toBe("Operator");
    expect(PERSONA_SHELL_HANDOFF_LINK).not.toContain("Operator");
    expect(PERSONA_SHELL_WORDMARK_ARIA_LABEL.toLowerCase()).not.toContain("operator");
    expect(PERSONA_SHELL_SIGN_OUT_HOME_ARIA_LABEL.toLowerCase()).not.toContain("operator");
    expect(PERSONA_SHELL_DEFAULT_DOCUMENT_TITLE.toLowerCase()).not.toContain("operator");
  });
});
