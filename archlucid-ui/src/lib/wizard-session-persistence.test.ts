import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildWizardSessionStorageKey,
  clearWizardSessionSnapshot,
  readWizardSessionSnapshot,
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

describe("wizard-session-persistence (TB-2157)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-a",
        workspaceId: "workspace-a",
        projectId: "project-a",
        workspaceLabel: "Workspace A",
        projectLabel: "Project A",
      }),
    );
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.removeItem("archlucid_operator_scope_v1");
  });

  it("scopes storage keys by tenant and workspace", () => {
    expect(buildWizardSessionStorageKey(WIZARD_SESSION_IDS.reviewsNewQuickStart)).toBe(
      "archlucid:wizard-session:v1:reviews-new-quick-start:tenant-a:workspace-a",
    );
  });

  it("writes and reads wizard snapshots", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 2,
      state: { runTitle: "Retail API", briefText: "Context" },
    });

    const snapshot = readWizardSessionSnapshot<{ runTitle: string; briefText: string }>(
      WIZARD_SESSION_IDS.reviewsNewQuickStart,
    );

    expect(snapshot?.stepIndex).toBe(2);
    expect(snapshot?.state.runTitle).toBe("Retail API");
    expect(snapshot?.state.briefText).toBe("Context");
  });

  it("clears persisted wizard state on successful completion", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.adminSsoWizard, {
      stepIndex: 1,
      state: { issuerUri: "https://idp.example.com" },
    });

    clearWizardSessionSnapshot(WIZARD_SESSION_IDS.adminSsoWizard);

    expect(readWizardSessionSnapshot(WIZARD_SESSION_IDS.adminSsoWizard)).toBeNull();
  });
});
