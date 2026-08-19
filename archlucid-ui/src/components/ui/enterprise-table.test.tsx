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
});
