import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraDiagramsExportHonestyStrip } from "@/components/infra-evidence/InfraDiagramsExportHonestyStrip";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXPORT_HONESTY_LINE } from "@/lib/governance/governance-infrastructure-copy";

describe("InfraDiagramsExportHonestyStrip", () => {
  it("renders diagram export honesty without sponsor disposition copy", () => {
    render(<InfraDiagramsExportHonestyStrip />);

    expect(screen.getByTestId("infra-diagrams-export-honesty")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXPORT_HONESTY_LINE,
    );
    expect(screen.queryByTestId("infra-diagrams-export-disposition")).not.toBeInTheDocument();
  });
});
