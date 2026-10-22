import { describe, expect, it } from "vitest";

import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import {
  WORKSPACE_SCOPE_EMPTY_TEACHING_CTA_LABEL,
  WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT,
  buildAlertsInboxWorkspaceScopeEmptyTeaching,
  buildArchitecturesHubWorkspaceScopeEmptyTeaching,
  buildGovernanceFindingsHubWorkspaceScopeEmptyTeaching,
  buildReviewsHubWorkspaceScopeEmptyTeaching,
  buildSignedRecordsHubWorkspaceScopeEmptyTeaching,
  buildWorkspaceScopeEmptyTeaching,
  resolveWorkspaceScopeEmptyTeachingForHub,
  resolveWorkspaceScopeEmptyTeachingScopeLabel,
  shouldShowWorkspaceScopeEmptyTeaching,
} from "@/lib/workspace-scope-empty-teaching";

function record(overrides: Partial<OperatorScopeRecord> = {}): OperatorScopeRecord {
  return {
    tenantId: DEV_SCOPE_TENANT_ID,
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    projectId: DEV_SCOPE_PROJECT_ID,
    workspaceLabel: "",
    projectLabel: "",
    ...overrides,
  };
}

describe("buildWorkspaceScopeEmptyTeaching", () => {
  it("builds honest title, body, and CTA from scope label and object plural", () => {
    const copy = buildWorkspaceScopeEmptyTeaching({
      scopeLabel: "Payments",
      objectPlural: "reviews",
      switcherHint: "Switch workspace/project to see other work.",
    });

    expect(copy.title).toBe("No reviews in Payments");
    expect(copy.body).toBe("Switch workspace/project to see other work.");
    expect(copy.ctaLabel).toBe(WORKSPACE_SCOPE_EMPTY_TEACHING_CTA_LABEL);
  });

  it("falls back when labels are blank without claiming wrong-workspace certainty", () => {
    const copy = buildWorkspaceScopeEmptyTeaching({
      scopeLabel: "   ",
      objectPlural: "",
      switcherHint: "",
    });

    expect(copy.title).toBe("No items in this project");
    expect(copy.body).toBe(WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT);
    expect(copy.ctaLabel).toBe(WORKSPACE_SCOPE_EMPTY_TEACHING_CTA_LABEL);
  });
});

describe("shouldShowWorkspaceScopeEmptyTeaching", () => {
  it("is false when the list is not empty", () => {
    expect(
      shouldShowWorkspaceScopeEmptyTeaching({
        listEmpty: false,
        scopeRecord: record({
          workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        }),
      }),
    ).toBe(false);
  });

  it("is false when no switcher selection is stored", () => {
    expect(shouldShowWorkspaceScopeEmptyTeaching({ listEmpty: true, scopeRecord: null })).toBe(false);
  });

  it("is false for the dev-default scope (generic empty stays)", () => {
    expect(shouldShowWorkspaceScopeEmptyTeaching({ listEmpty: true, scopeRecord: record() })).toBe(false);
  });

  it("is true when empty under a specific non-default project selection", () => {
    expect(
      shouldShowWorkspaceScopeEmptyTeaching({
        listEmpty: true,
        scopeRecord: record({
          workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          projectLabel: "Payments",
        }),
      }),
    ).toBe(true);
  });
});

describe("resolveWorkspaceScopeEmptyTeachingScopeLabel", () => {
  it("prefers the stored project label", () => {
    expect(resolveWorkspaceScopeEmptyTeachingScopeLabel(record({ projectLabel: "Payments" }))).toBe(
      "Payments",
    );
  });

  it("falls back to the neutral project label for the scope ids", () => {
    expect(resolveWorkspaceScopeEmptyTeachingScopeLabel(record())).toBe("Primary project");
  });

  it("uses this project when no record is present", () => {
    expect(resolveWorkspaceScopeEmptyTeachingScopeLabel(null)).toBe("this project");
  });
});

describe("buildReviewsHubWorkspaceScopeEmptyTeaching", () => {
  it("targets reviews with the default switcher hint", () => {
    const copy = buildReviewsHubWorkspaceScopeEmptyTeaching(
      record({
        workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        projectLabel: "Payments",
      }),
    );

    expect(copy.title).toBe("No reviews in Payments");
    expect(copy.body).toBe(WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT);
  });
});

describe("hub workspace scope empty teaching builders (TB-2387)", () => {
  const scopedRecord = record({
    workspaceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    projectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    projectLabel: "Payments",
  });

  it("names object plurals per hub", () => {
    expect(buildArchitecturesHubWorkspaceScopeEmptyTeaching(scopedRecord).title).toBe(
      "No architecture drafts in Payments",
    );
    expect(buildSignedRecordsHubWorkspaceScopeEmptyTeaching(scopedRecord).title).toBe(
      "No finalized review records in Payments",
    );
    expect(buildGovernanceFindingsHubWorkspaceScopeEmptyTeaching(scopedRecord).title).toBe(
      "No findings in Payments",
    );
    expect(buildAlertsInboxWorkspaceScopeEmptyTeaching(scopedRecord).title).toBe("No alerts in Payments");
  });

  it("resolveWorkspaceScopeEmptyTeachingForHub returns null for dev-default scope", () => {
    expect(
      resolveWorkspaceScopeEmptyTeachingForHub({
        listEmpty: true,
        scopeRecord: record(),
        objectPlural: "findings",
      }),
    ).toBeNull();
  });

  it("resolveWorkspaceScopeEmptyTeachingForHub returns copy for scoped empty lists", () => {
    const copy = resolveWorkspaceScopeEmptyTeachingForHub({
      listEmpty: true,
      scopeRecord: scopedRecord,
      objectPlural: "findings",
    });

    expect(copy?.title).toBe("No findings in Payments");
  });
});
