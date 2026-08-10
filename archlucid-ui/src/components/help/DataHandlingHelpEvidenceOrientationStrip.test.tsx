import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataHandlingHelpEvidenceOrientationStrip } from "@/components/help/DataHandlingHelpEvidenceOrientationStrip";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";

describe("DataHandlingHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and all Sources links", () => {
    render(<DataHandlingHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-data-handling-tenant-isolation-claim-discipline")).toHaveTextContent(
      DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE,
    );

    for (const link of DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});
