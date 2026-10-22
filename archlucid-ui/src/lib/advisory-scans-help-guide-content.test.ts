import { describe, expect, it } from "vitest";

import {
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_REJECT,
} from "@/lib/advisory-copy";
import { ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE } from "@/lib/advisory-scans-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_CARD_FIELD_LABELS,
  ADVISORY_SCANS_HELP_DISPOSITION_ACTIONS,
  ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS,
  ADVISORY_SCANS_HELP_OUTPUT_FIELDS,
  ADVISORY_SCANS_HELP_SUMMARY_METRIC_LABELS,
  ADVISORY_SCANS_HELP_SUMMARY_METRICS,
} from "@/lib/advisory-scans-help-guide-content";

describe("advisory-scans help guide content label parity", () => {
  it("keeps output field labels aligned with advisory card labels", () => {
    expect(ADVISORY_SCANS_HELP_OUTPUT_FIELDS.map((field) => field.label)).toEqual([
      ...ADVISORY_SCANS_HELP_CARD_FIELD_LABELS,
    ]);
  });

  it("keeps summary metric labels aligned with advisory-copy constants", () => {
    expect(ADVISORY_SCANS_HELP_SUMMARY_METRICS.map((metric) => metric.label)).toEqual([
      ...ADVISORY_SCANS_HELP_SUMMARY_METRIC_LABELS,
    ]);
  });

  it("keeps disposition action labels aligned with hub DISPOSITION_ACTIONS", () => {
    const expectedLabels = [
      ADVISORY_SCANS_DISPOSITION_ACCEPT,
      ADVISORY_SCANS_DISPOSITION_DEFER,
      ADVISORY_SCANS_DISPOSITION_REJECT,
      ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
    ];

    expect(ADVISORY_SCANS_HELP_DISPOSITION_ACTIONS.map((action) => action.label)).toEqual(expectedLabels);
  });

  it("derives claim discipline from inline capability boundary constant", () => {
    expect(ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE).toBe(ADVISORY_SCANS_HELP_NEGATION_DRIFT_MARKERS.claimMustContain);
  });
});
