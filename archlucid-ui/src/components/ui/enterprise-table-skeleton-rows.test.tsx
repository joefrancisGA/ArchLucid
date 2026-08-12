import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EnterpriseTable,
  EnterpriseTableBody,
} from "@/components/ui/enterprise-table";
import { EnterpriseTableSkeletonRows } from "@/components/ui/enterprise-table-skeleton-rows";

function renderRows(props: Parameters<typeof EnterpriseTableSkeletonRows>[0]) {
  return render(
    <EnterpriseTable ariaLabel="Tenant health scores">
      <EnterpriseTableBody>
        <EnterpriseTableSkeletonRows {...props} />
      </EnterpriseTableBody>
    </EnterpriseTable>,
  );
}

describe("EnterpriseTableSkeletonRows (TB-2381)", () => {
  it("reserves three rows by default", () => {
    renderRows({ columns: 4 });

    expect(screen.getAllByTestId("enterprise-table-skeleton-rows-row")).toHaveLength(3);
  });

  it("honours an explicit row count", () => {
    renderRows({ columns: 2, rows: 5 });

    expect(screen.getAllByTestId("enterprise-table-skeleton-rows-row")).toHaveLength(5);
  });

  it("renders one placeholder cell per column", () => {
    renderRows({ columns: 6, rows: 1 });

    const [row] = screen.getAllByTestId("enterprise-table-skeleton-rows-row");

    expect(within(row).getAllByRole("cell")).toHaveLength(6);
  });

  it("announces loading once rather than per cell", () => {
    renderRows({ columns: 4, rows: 3 });

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading rows…");
  });

  it("honours a custom announcement label", () => {
    renderRows({ columns: 2, label: "Loading tenant health…" });

    expect(screen.getByRole("status")).toHaveTextContent("Loading tenant health…");
  });

  it("scopes test ids so multiple tables stay addressable", () => {
    renderRows({ columns: 2, rows: 1, testId: "tenant-health-skeleton" });

    expect(screen.getAllByTestId("tenant-health-skeleton-row")).toHaveLength(1);
  });
});
