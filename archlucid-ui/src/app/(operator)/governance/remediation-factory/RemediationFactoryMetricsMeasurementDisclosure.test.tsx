import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY } from "./remediation-factory-metric-presentation";
import { RemediationFactoryMetricsMeasurementDisclosure } from "./RemediationFactoryMetricsMeasurementDisclosure";

describe("RemediationFactoryMetricsMeasurementDisclosure", () => {
  it("keeps the measurement copy in a closed disclosure until opened", () => {
    render(<RemediationFactoryMetricsMeasurementDisclosure />);

    const toggle = screen.getByTestId("remediation-metrics-measurement-help-link");
    expect(toggle).toHaveTextContent("How these counts are measured");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("remediation-metrics-measurement-body")).not.toBeInTheDocument();
    expect(screen.queryByText(REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("remediation-metrics-measurement-body")).toHaveTextContent(
      REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY,
    );
  });
});
