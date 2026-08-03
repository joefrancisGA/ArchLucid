import { describe, expect, it } from "vitest";

import {
  DPA_TEMPLATE_HELP_CANONICAL_PATH,
  DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE,
  DPA_TEMPLATE_HELP_ORIENTATION,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  DPA_TEMPLATE_HELP_SOURCES,
} from "@/lib/dpa-template-help-guide-content";

describe("dpa-template-help-guide-content", () => {
  it("keeps primary CTAs on Trust Center, subprocessors, and procurement", () => {
    expect(DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
    expect(DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.href).toBe("/help/subprocessors");
    expect(DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.href).toBe("/help/procurement");
  });

  it("lists orientation steps without architecture-runs jargon", () => {
    expect(DPA_TEMPLATE_HELP_ORIENTATION).toHaveLength(3);
    expect(DPA_TEMPLATE_HELP_ORIENTATION.join(" ").toLowerCase()).not.toContain("architecture runs");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(DPA_TEMPLATE_HELP_SOURCES.some((link) => link.href === DPA_TEMPLATE_HELP_CANONICAL_PATH)).toBe(false);
    expect(DPA_TEMPLATE_HELP_SOURCES.some((link) => link.href === "/trust")).toBe(true);
  });

  it("states claim discipline without implying certification or a signed DPA", () => {
    expect(DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not a countersigned");
    expect(DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("cpa");
  });
});
