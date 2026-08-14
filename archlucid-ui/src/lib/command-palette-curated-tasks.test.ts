import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import {
  COMMAND_PALETTE_CURATED_TASKS,
  commandPaletteNavVisibilityHref,
} from "@/lib/command-palette-curated-tasks";
import {
  FIRST_REVIEW_GUIDE_PATH,
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
} from "@/lib/first-review-guide-route";

describe("COMMAND_PALETTE_CURATED_TASKS (TB-2241)", () => {
  it("lists architecture intelligence as a contextual-only quick task", () => {
    const task = COMMAND_PALETTE_CURATED_TASKS.find((entry) => entry.href === ARCHITECTURE_INTELLIGENCE_PATH);

    expect(task).toBeDefined();
    expect(task?.label).toBe("Architecture intelligence");
    expect(task?.searchValue).toMatch(/closed-loop reasoning/i);
  });

  it("deep-links onboarding checklist to the walkthrough progress section", () => {
    const task = COMMAND_PALETTE_CURATED_TASKS.find((entry) => entry.label === "Onboarding checklist");

    expect(task?.href).toBe(`${FIRST_REVIEW_GUIDE_PATH}#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`);
  });

  it("strips hash fragments when matching curated tasks to nav visibility", () => {
    expect(
      commandPaletteNavVisibilityHref(
        `${FIRST_REVIEW_GUIDE_PATH}#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`,
      ),
    ).toBe(FIRST_REVIEW_GUIDE_PATH);
  });
});
