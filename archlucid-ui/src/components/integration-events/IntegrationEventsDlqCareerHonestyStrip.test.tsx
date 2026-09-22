import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntegrationEventsDlqCareerHonestyStrip } from "@/components/integration-events/IntegrationEventsDlqCareerHonestyStrip";
import {
  INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_BODY,
  INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE,
} from "@/lib/internal/integration-events-dlq-career-honesty";

describe("IntegrationEventsDlqCareerHonestyStrip (CG-094)", () => {
  it("renders unconditional ops honesty strip", () => {
    render(<IntegrationEventsDlqCareerHonestyStrip />);

    expect(screen.getByTestId("integration-events-dlq-career-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("integration-events-dlq-career-honesty-title")).toHaveTextContent(
      INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE,
    );
    expect(screen.getByTestId("integration-events-dlq-career-honesty-body")).toHaveTextContent(
      INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_BODY,
    );
  });
});
