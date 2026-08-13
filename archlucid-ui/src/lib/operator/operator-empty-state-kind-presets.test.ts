import { describe, expect, it } from "vitest";

import * as enterpriseCompactEmptyStatePresets from "@/lib/enterprise-compact-empty-state-presets";
import {
  ADVISORY_SCHEDULES_EMPTY_COMPACT,
  ALERT_RULES_LIST_EMPTY_COMPACT,
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import {
  OPERATOR_EMPTY_STATE_PRESET_KINDS,
  buildOperatorCollectionEmptyCompact,
  buildOperatorFilteredEmptyCompact,
  buildOperatorHubZoneEmptyCompact,
  buildOperatorPermissionEmptyCompact,
  operatorCollectionEmptyTitle,
  operatorFilteredEmptyTitle,
  operatorPermissionEmptyTitle,
} from "@/lib/operator/operator-empty-state-kind-presets";

describe("operator-empty-state-kind-presets (TB-1555)", () => {
  it("formats collection and filtered title patterns", () => {
    expect(operatorCollectionEmptyTitle("alert rules")).toBe("No alert rules yet");
    expect(operatorFilteredEmptyTitle("risks")).toBe("No risks match this filter");
    expect(operatorFilteredEmptyTitle()).toBe("No matches for this filter");
    expect(operatorPermissionEmptyTitle("manage advisory scans")).toBe(
      "You need access to manage advisory scans",
    );
  });

  it("builds hub-zone presets with stable test ids", () => {
    expect(ALERT_RULES_LIST_EMPTY_COMPACT).toEqual(
      buildOperatorHubZoneEmptyCompact("alert rules", {
        testId: "alert-rules-empty",
        description: ALERT_RULES_LIST_EMPTY_COMPACT.description,
      }),
    );
    expect(ADVISORY_SCHEDULES_EMPTY_COMPACT.title).toBe("No advisory-scan schedules yet");
    expect(GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT.title).toBe("No risks match this filter");
  });

  it("maps exported compact presets to operator empty kinds for TB-1556", () => {
    const compactPresetKeys = Object.keys(enterpriseCompactEmptyStatePresets).filter((key) =>
      key.endsWith("_COMPACT"),
    );

    for (const presetKey of compactPresetKeys) {
      expect(OPERATOR_EMPTY_STATE_PRESET_KINDS, presetKey).toHaveProperty(presetKey);
    }

    for (const [presetKey, kind] of Object.entries(OPERATOR_EMPTY_STATE_PRESET_KINDS)) {
      expect(enterpriseCompactEmptyStatePresets).toHaveProperty(presetKey);
      expect(kind).toMatch(/^(collection|hub-zone|filtered|prerequisite|permission|error)$/);
    }

    expect(Object.keys(OPERATOR_EMPTY_STATE_PRESET_KINDS).sort()).toEqual(compactPresetKeys.sort());
  });

  it("omits actions on filtered empties when no clear next step exists", () => {
    const filtered = buildOperatorFilteredEmptyCompact({
      testId: "filtered-empty",
      nounPhrase: "schedules",
      description: "Clear filters to see schedules again.",
      actions: [],
    });

    expect(filtered.actions).toEqual([]);
  });

  it("allows permission empties to keep a single access request CTA", () => {
    const permission = buildOperatorPermissionEmptyCompact("edit recurrence schedules", {
      testId: "permission-empty",
      description: "Ask a workspace admin to grant the Recurrence manager role.",
      actions: [{ label: "Open roles", href: "/administration/users?tab=roles", variant: "primary" }],
    });

    expect(permission.title).toBe("You need access to edit recurrence schedules");
    expect(permission.actions).toHaveLength(1);
  });

  it("builds collection presets with explicit variant on actions", () => {
    const collection = buildOperatorCollectionEmptyCompact("digest subscriptions", {
      testId: "digest-subscriptions-empty",
      description: "Create a subscription to receive scheduled digests.",
      actions: [{ label: "Create subscription", href: "/architecture/digests?tab=schedule", variant: "primary" }],
    });

    expect(collection.title).toBe("No digest subscriptions yet");
    expect(collection.actions?.[0]?.variant).toBe("primary");
  });
});
