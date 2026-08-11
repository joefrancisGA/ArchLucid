import { describe, expect, it } from "vitest";

import {
  EVIDENCE_INTAKE_HELP_PATH_OPTIONS,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS,
  EVIDENCE_INTAKE_HELP_RELATED_GUIDES,
  EVIDENCE_INTAKE_HELP_VERIFY_STEPS,
} from "@/lib/evidence-intake-help-guide-content";

describe("evidence-intake-help-guide-content", () => {
  it("keeps Start review and cloud connection CTAs on shipped surfaces (TB-1353)", () => {
    expect(EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.startReview.href).toBe("/architecture/reviews/new");
    expect(EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnections.href).toBe(
      "/integrations/cloud-connections",
    );
    expect(EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnectionsHelp.href).toBe(
      "/help/cloud-connections",
    );
  });

  it("maps three wizard paths to deep-linked /reviews/new tabs (TB-1351)", () => {
    expect(EVIDENCE_INTAKE_HELP_PATH_OPTIONS).toHaveLength(3);
    expect(EVIDENCE_INTAKE_HELP_PATH_OPTIONS.map((option) => option.href)).toEqual([
      "/architecture/reviews/new?path=quick-review",
      "/architecture/reviews/new?path=guided-intake",
      "/architecture/reviews/new?path=detailed",
    ]);
  });

  it("lists related guides with first-architecture-review and no first-hour alias (TB-1352)", () => {
    const hrefs = EVIDENCE_INTAKE_HELP_RELATED_GUIDES.map((link) => link.href);

    expect(hrefs).toContain("/help/first-architecture-review");
    expect(hrefs).not.toContain("/help/first-hour-operator-path");
    expect(hrefs).not.toContain("/help/pilot-guide");
  });

  it("defines verify-intake steps with in-app follow-up links (TB-1354)", () => {
    expect(EVIDENCE_INTAKE_HELP_VERIFY_STEPS).toHaveLength(3);
    expect(EVIDENCE_INTAKE_HELP_VERIFY_STEPS.some((step) => step.action.href === "/architecture/reviews")).toBe(
      true,
    );
  });
});
