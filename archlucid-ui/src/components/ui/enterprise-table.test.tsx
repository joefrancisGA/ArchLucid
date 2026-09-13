import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

describe("EnterpriseTable", () => {
  it("exposes grid semantics and column headers", () => {
    render(
      <EnterpriseTable ariaLabel="Sample reviews">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          <EnterpriseTableRow>
            <EnterpriseTableCell>Contoso retail</EnterpriseTableCell>
          </EnterpriseTableRow>
        </EnterpriseTableBody>
      </EnterpriseTable>,
    );

    expect(screen.getByRole("table", { name: "Sample reviews" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByText("Contoso retail")).toBeInTheDocument();
  });

  it("does not apply content-visibility to table rows (IE-DT-01)", () => {
    expect(DESIGN_TOKENS.table.row).not.toMatch(/content-visibility/);

    render(
      <EnterpriseTable ariaLabel="Drift changes">
        <EnterpriseTableBody>
          <EnterpriseTableRow data-testid="enterprise-table-sample-row">
            <EnterpriseTableCell>gateway</EnterpriseTableCell>
          </EnterpriseTableRow>
        </EnterpriseTableBody>
      </EnterpriseTable>,
    );

    const row = screen.getByTestId("enterprise-table-sample-row");

    expect(row.className).not.toContain("content-visibility-auto");
    expect(row.className).not.toMatch(/content-visibility/);
  });

  it("keeps a sticky header row token for long inventory tables (IE-DT-02)", () => {
    expect(DESIGN_TOKENS.table.headRow).toContain("sticky");
    expect(DESIGN_TOKENS.table.headRow).toContain("top-0");
  });
});
