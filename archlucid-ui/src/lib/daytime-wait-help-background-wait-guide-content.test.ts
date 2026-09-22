import { describe, expect, it } from "vitest";

import { CAREER_REHEARSAL_HELP_RECORD_EXECUTE_LABEL } from "@/lib/career-rehearsal-help-guide-content";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_NO_PERCENTAGE_BODY,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING,
} from "@/lib/daytime-wait-help-background-wait-guide-content";
import { DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH } from "@/lib/daytime-wait-help-proxy-timeout-route";

describe("daytime-wait-help-background-wait-guide-content (DW-015)", () => {
  it("reuses cancel-abandon clarity without forking copy", () => {
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY).toEqual(buildCancelAbandonInFlightClarity());
  });

  it("keeps unique hash anchors for every TOC heading", () => {
    const ids = DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS.map((heading) => heading.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("forbids stay-on-this-page and fake progress in overview guard string", () => {
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW).not.toMatch(/stay on this page/i);
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_NO_PERCENTAGE_BODY).toMatch(/percentComplete/);
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_NO_PERCENTAGE_BODY).toMatch(/\/v1\/runs\/\{runId\}\/progress/);
  });

  it("links ADR 0096 to the in-app proxy-timeout topic", () => {
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_IN_APP_HREF).toBe(DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH);
  });

  it("uses Record execute vocabulary instead of Career Real", () => {
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING).toContain(
      CAREER_REHEARSAL_HELP_RECORD_EXECUTE_LABEL,
    );
    expect(DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING).not.toMatch(/Career Real/i);
  });
});
