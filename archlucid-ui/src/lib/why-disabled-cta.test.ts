import { describe, expect, it } from "vitest";

import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import {
  firstWhyDisabledCtaReason,
  formatWhyDisabledCtaMessage,
  whyDisabledBusy,
  whyDisabledEnterpriseMutationControl,
  whyDisabledNeedsLifecycle,
  whyDisabledNeedsPrerequisite,
  whyDisabledNeedsRole,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

describe("formatWhyDisabledCtaMessage", () => {
  it("returns null for null or undefined", () => {
    expect(formatWhyDisabledCtaMessage(null)).toBeNull();
    expect(formatWhyDisabledCtaMessage(undefined)).toBeNull();
  });

  it("returns null for blank messages", () => {
    const blank: WhyDisabledCtaReason = { kind: "policy", message: "   " };

    expect(formatWhyDisabledCtaMessage(blank)).toBeNull();
  });

  it("returns trimmed message text", () => {
    const reason: WhyDisabledCtaReason = { kind: "role", message: "  Needs admin  " };

    expect(formatWhyDisabledCtaMessage(reason)).toBe("Needs admin");
  });
});

describe("firstWhyDisabledCtaReason", () => {
  it("skips null, undefined, and blank messages", () => {
    const blank: WhyDisabledCtaReason = { kind: "busy", message: "" };
    const role = whyDisabledNeedsRole("Architect");

    expect(firstWhyDisabledCtaReason([null, undefined, blank, role])).toEqual(role);
  });

  it("returns null when no usable reason exists", () => {
    expect(firstWhyDisabledCtaReason([null, undefined, { kind: "policy", message: " " }])).toBeNull();
  });
});

describe("why-disabled helpers", () => {
  it("builds role, lifecycle, prerequisite, and busy reasons", () => {
    expect(whyDisabledNeedsRole("elevated workspace permissions")).toEqual({
      kind: "role",
      message: "Requires elevated workspace permissions to continue.",
    });
    expect(whyDisabledNeedsLifecycle("package finalization")).toEqual({
      kind: "lifecycle",
      message: "Complete package finalization before continuing.",
    });
    expect(whyDisabledNeedsPrerequisite("a finalized package")).toEqual({
      kind: "prerequisite",
      message: "Requires a finalized package before this action is available.",
    });
    expect(whyDisabledBusy("Export")).toEqual({
      kind: "busy",
      message: "Export is in progress.",
    });
    expect(whyDisabledEnterpriseMutationControl()).toEqual({
      kind: "role",
      message: enterpriseMutationControlDisabledTitle,
    });
  });
});