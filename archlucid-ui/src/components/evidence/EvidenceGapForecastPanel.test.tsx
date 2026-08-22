import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import {
  deriveEvidencePresenceFromFileNames,
  EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_SUMMARY,
} from "@/lib/evidence-gap-forecast";

describe("EvidenceGapForecastPanel", () => {
  it("shows document-attached coverage copy for generic document uploads", () => {
    const fileNames = ["ARCHITECTURAL_HANDBOOK_20240428.docx"];
    const presence = deriveEvidencePresenceFromFileNames(fileNames);

    render(
      <EvidenceGapForecastPanel
        presence={presence}
        attachmentFileNames={fileNames}
        presentation="summary"
      />,
    );

    expect(screen.getByTestId("evidence-gap-forecast-summary")).toHaveTextContent(
      EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_SUMMARY,
    );
    expect(screen.getByTestId("evidence-gap-forecast-summary")).not.toHaveTextContent("0 of 5");
  });
});
