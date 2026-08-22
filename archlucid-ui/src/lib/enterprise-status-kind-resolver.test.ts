import { describe, expect, it } from "vitest";

import {
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/pipeline-status-labels";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";
import { runPipelineStatusTagKind } from "@/lib/runs/run-pipeline-status-presentation";
import { governanceDomainBadgeClass } from "@/lib/status-pill-domain-classes";

describe("resolveEnterpriseStatusKind (TB-2285)", () => {
  describe("run / pipeline status", () => {
    it.each([
      [PIPELINE_STATUS_LABELS.finalized, "ready"],
      [PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized, "ready"],
      [PIPELINE_STATUS_LABELS.readyToFinalize, "needs-attention"],
      [PIPELINE_STATUS_BUYER_DISPLAY_LABELS.readyToFinalize, "needs-attention"],
      [PIPELINE_STATUS_LABELS.inPipeline, "in-progress"],
      [PIPELINE_STATUS_BUYER_DISPLAY_LABELS.inPipeline, "in-progress"],
      [PIPELINE_STATUS_LABELS.starting, "neutral"],
    ] as const)("maps pipeline label %s → %s", (label, kind) => {
      expect(resolveEnterpriseStatusKind(label, "pipeline")).toBe(kind);
      expect(runPipelineStatusTagKind(label)).toBe(kind);
    });
  });

  describe("governance approval", () => {
    it.each([
      ["Draft", "draft"],
      ["Submitted", "in-progress"],
      ["Approved", "approved"],
      ["Rejected", "blocked"],
      ["Promoted", "approved"],
      ["Activated", "ready"],
      ["Approved with monitoring", "approved-with-monitoring"],
      ["Pending architecture review", "in-progress"],
      ["Passed", "approved"],
      ["Failed", "blocked"],
      ["Not required", "neutral"],
      ["Withdrawn", "neutral"],
      ["No approval decision recorded", "neutral"],
    ] as const)("maps governance label %s → %s", (label, kind) => {
      expect(resolveEnterpriseStatusKind(label, "governance")).toBe(kind);
    });

    it("returns token-backed governance badge classes without legacy raw Tailwind fills", () => {
      for (const status of ["Draft", "Submitted", "Approved", "Rejected", "Promoted", "Activated"]) {
        const className = governanceDomainBadgeClass(status);

        expect(className).not.toContain("blue-500/10");
        expect(className).not.toContain("violet-500");
        expect(className).not.toContain("teal-500");
      }

      expect(governanceDomainBadgeClass("Draft")).toContain("bg-[var(--al-status-neutral-bg)]");
      expect(governanceDomainBadgeClass("Approved")).toContain("bg-[var(--al-status-approved-bg)]");
    });
  });

  describe("health", () => {
    it.each([
      ["Healthy", "ready"],
      ["Degraded", "needs-attention"],
      ["Not configured", "neutral"],
      ["Unhealthy", "blocked"],
      ["Warning", "needs-attention"],
    ] as const)("maps health label %s → %s", (label, kind) => {
      expect(resolveEnterpriseStatusKind(label, "health")).toBe(kind);
    });
  });

  describe("budget", () => {
    it.each([
      ["Configured", "ready"],
      ["Not configured", "needs-attention"],
      ["Hard stop at cap", "blocked"],
      ["AI budget: 0% — paused", "blocked"],
      ["AI budget: 24%", "needs-attention"],
    ] as const)("maps budget label %s → %s", (label, kind) => {
      expect(resolveEnterpriseStatusKind(label, "budget")).toBe(kind);
    });
  });
});
