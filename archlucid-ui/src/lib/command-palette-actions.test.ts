import { describe, expect, it } from "vitest";

import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import {
  FIRST_REVIEW_GUIDE_PATH,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
} from "@/lib/first-review-guide-route";
import { getRouteTitle } from "@/lib/route-titles";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

describe("command-palette-actions (TB-1963)", () => {
  it("opens sponsor report on canonical sponsor-report path", () => {
    const valueReportAction = COMMAND_PALETTE_ACTIONS.find((action) => action.id === "action-export-value");

    expect(valueReportAction).toBeDefined();
    expect(valueReportAction?.href).toBe(SPONSOR_REPORT_PATH);
    expect(valueReportAction?.href).not.toBe("/value-report");
  });

  /**
   * Only rows phrased as "Open <destination>" make a naming claim about a whole page. Rows like
   * "Configure AI quality gates" name a control inside a page, so they are not held to its title.
   */
  it("names every Open action after the destination it opens", () => {
    const openActions = COMMAND_PALETTE_ACTIONS.filter(
      (action) => action.label.startsWith("Open ") && !action.href.includes("#"),
    );
    const mismatches: string[] = [];

    expect(openActions.length).toBeGreaterThan(0);

    for (const action of openActions) {
      const expectedLabel = `Open ${getRouteTitle(action.href).toLowerCase()}`;

      if (action.label !== expectedLabel) {
        mismatches.push(`${action.id}: label="${action.label}" expected="${expectedLabel}"`);
      }
    }

    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("labels review intake as start review, not create architecture", () => {
    const createReviewAction = COMMAND_PALETTE_ACTIONS.find((action) => action.id === "action-create-review");

    expect(createReviewAction?.href).toBe("/architecture/reviews/new");
    expect(createReviewAction?.label).toBe(START_REVIEW_LABEL);
  });

  it("names the sponsor report action after the sponsor report page", () => {
    const valueReportAction = COMMAND_PALETTE_ACTIONS.find((action) => action.id === "action-export-value");

    expect(valueReportAction?.label).toBe("Open sponsor report");
    expect(valueReportAction?.searchValue).toMatch(/value report/i);
  });

  it("opens finish workspace setup on first-review-guide optional setup anchor", () => {
    const finishSetupAction = COMMAND_PALETTE_ACTIONS.find((action) => action.id === "action-finish-setup");

    expect(finishSetupAction).toBeDefined();
    expect(finishSetupAction?.href).toBe(`${FIRST_REVIEW_GUIDE_PATH}#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}`);
    expect(finishSetupAction?.href).not.toContain("/onboarding");
  });
});
