import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { InfraEvidenceAuditScopeChip } from "@/components/infra-evidence/InfraEvidenceAuditScopeChip";

describe("InfraEvidenceAuditScopeChip", () => {
  it("renders as a link when href is provided", () => {
    render(
      <InfraEvidenceAuditScopeChip
        controlLabel="AC-2 · Account management"
        href="/governance/infrastructure/resources/res-1?tab=audit"
        testId="infra-resource-hub-audit-scope-chip"
      />,
    );

    const chip = screen.getByTestId("infra-resource-hub-audit-scope-chip");

    expect(chip.tagName).toBe("A");
    expect(chip).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/res-1?tab=audit",
    );
    expect(chip).toHaveTextContent("Audit scoped: AC-2 · Account management");
  });
});
