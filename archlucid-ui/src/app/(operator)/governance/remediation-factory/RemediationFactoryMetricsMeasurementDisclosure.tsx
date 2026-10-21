"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

import {
  REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY,
  REMEDIATION_FACTORY_METRICS_MEASUREMENT_TITLE,
} from "./remediation-factory-metric-presentation";

export function RemediationFactoryMetricsMeasurementDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid="remediation-metrics-measurement-help-link"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        {REMEDIATION_FACTORY_METRICS_MEASUREMENT_TITLE}
      </button>
      {open ? (
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-metrics-measurement-body">
          {REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY}
        </p>
      ) : null}
    </div>
  );
}
