import { describe, expect, it } from "vitest";

import {
  buildSecureNowStopItsmOutboundHandoffHref,
  parseSecureNowStopItsmOutboundDraftFromSearch,
  SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM,
  SECURENOW_PILOT_STOP_ITSM_DRAFT_RATIONALE_PARAM,
} from "@/lib/product-line/securenow-stop-itsm-handoff";

describe("securenow-stop-itsm-handoff", () => {
  it("builds runbooks handoff with path id and rationale query params", () => {
    const href = buildSecureNowStopItsmOutboundHandoffHref("path-abc", "Pilot ended.");

    expect(href).toContain("/internal/integrations/itsm?");
    expect(href).toContain("itsmStep=runbooks");
    expect(href).toContain(`${SECURENOW_PILOT_STOP_ITSM_DRAFT_PATH_ID_PARAM}=path-abc`);
    expect(href).toMatch(/pilotStopRationale=Pilot(\+|%20)ended\./);
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
