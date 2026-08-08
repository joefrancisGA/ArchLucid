import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ALERT_RULES_CLAIM_DISCIPLINE } from "@/lib/alert-rules-evidence-copy";

import { AlertRulesEvidenceOrientationStrip } from "./AlertRulesEvidenceOrientationStrip";

describe("AlertRulesEvidenceOrientationStrip", () => {
  it("shows claim discipline without Sources for follow-up", () => {
    render(<AlertRulesEvidenceOrientationStrip />);

    expect(screen.queryByTestId("alert-rules-sources")).toBeNull();
    expect(screen.getByTestId("alert-rules-claim-discipline")).toHaveTextContent(
      ALERT_RULES_CLAIM_DISCIPLINE,
    );
  });
});
