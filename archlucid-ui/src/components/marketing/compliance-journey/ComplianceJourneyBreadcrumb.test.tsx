import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  COMPLIANCE_JOURNEY_BREADCRUMB_HUB_LABEL,
  COMPLIANCE_JOURNEY_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/compliance-journey-page-copy";

import { ComplianceJourneyBreadcrumb } from "./ComplianceJourneyBreadcrumb";

describe("ComplianceJourneyBreadcrumb", () => {
  it("renders Welcome → Compliance journey trail", () => {
    render(<ComplianceJourneyBreadcrumb />);

    const breadcrumb = screen.getByTestId("compliance-journey-breadcrumb");
    expect(breadcrumb).toHaveTextContent(COMPLIANCE_JOURNEY_BREADCRUMB_HUB_LABEL);
    expect(breadcrumb).toHaveTextContent(COMPLIANCE_JOURNEY_BREADCRUMB_TOPIC_TITLE);
  });
});
