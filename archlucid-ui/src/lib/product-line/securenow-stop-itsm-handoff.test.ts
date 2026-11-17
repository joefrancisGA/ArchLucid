import { describe, expect, it } from "vitest";

import {
  buildSecureNowStopItsmFindingExportHandoffHref,
  buildSecureNowStopItsmOutboundHandoffHref,
  formatSecureNowPilotStopItsmDraftBody,
  parseSecureNowStopItsmOutboundDraftFromSearch,
  resolveSecureNowStopItsmOutboundHandoffHref,
  SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM,
  SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM,
} from "@/lib/product-line/securenow-stop-itsm-handoff";
import {
  ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM,
  ITSM_OUTBOUND_CREATE_OPEN_PARAM,
} from "@/lib/itsm/itsm-outbound-create-issue-panels-url";

describe("securenow-stop-itsm-handoff", () => {
  it("builds runbooks handoff with path id and rationale query params", () => {
    const href = buildSecureNowStopItsmOutboundHandoffHref("path-abc", "Pilot ended.");

    expect(href).toContain("/internal/integrations/itsm?");
    expect(href).toContain("itsmStep=runbooks");
    expect(href).toContain(`${SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM}=path-abc`);
    expect(href).toMatch(/pilotStopRationale=Pilot(\+|%20)ended\./);
  });

  it("builds remediation finding export handoff with ITSM create params and pilot stop draft", () => {
    const href = buildSecureNowStopItsmFindingExportHandoffHref({
      findingId: "finding-1",
      pathId: "path-abc",
      rationale: "Pilot ended.",
      snapshotId: "snapshot-1",
    });

    expect(href).toContain("findingId=finding-1");
    expect(href).toContain("snapshotId=snapshot-1");
    expect(href).toContain(`${ITSM_OUTBOUND_CREATE_OPEN_PARAM}=1`);
    expect(href).toContain(`${ITSM_OUTBOUND_CREATE_FINDING_ID_PARAM}=finding-1`);
    expect(href).toContain(`${SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM}=path-abc`);
    expect(href).toMatch(/pilotStopRationale=Pilot(\+|%20)ended\./);
    expect(href).not.toContain("/internal/integrations/itsm");
  });

  it("resolves finding export when finding id is present", () => {
    const href = resolveSecureNowStopItsmOutboundHandoffHref({
      findingId: "finding-1",
      pathId: "path-abc",
      rationale: "Stop now.",
    });

    expect(href).toContain("findingId=finding-1");
    expect(href).toContain(`${ITSM_OUTBOUND_CREATE_OPEN_PARAM}=1`);
  });

  it("formats pilot stop draft body", () => {
    expect(formatSecureNowPilotStopItsmDraftBody("path-1", "Rationale text")).toBe(
      "SecureNow pilot Stop disposition\nPath: path-1\nRationale: Rationale text",
    );
  });

  it("parses draft params from search", () => {
    const params = new URLSearchParams();
    params.set(SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM, "path-1");
    params.set(SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM, "Stop rationale");

    expect(parseSecureNowStopItsmOutboundDraftFromSearch(params)).toEqual({
      pathId: "path-1",
      rationale: "Stop rationale",
    });
  });
});
