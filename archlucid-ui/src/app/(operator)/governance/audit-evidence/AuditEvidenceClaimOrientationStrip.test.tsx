import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditEvidenceClaimOrientationStrip } from "./AuditEvidenceClaimOrientationStrip";

describe("AuditEvidenceClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<AuditEvidenceClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("audit-evidence-lineage-sources")).toBeInTheDocument();
  });
});
