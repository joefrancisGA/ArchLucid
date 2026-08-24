import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
  ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE,
  ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE,
  ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/create-vs-review-intake-copy";
import {
  CONTINUE_DRAFT_LABEL,
  CREATE_ARCHITECTURE_LABEL,
  START_NEW_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";

describe("create-vs-review-intake-copy (TB-1459)", () => {
  it("discloses account sync for saved drafts without implying review filing is required", () => {
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("account");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("sync");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("this browser");
  });

  it("aligns view-all drafts label with saved-draft inventory", () => {
    expect(ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL.toLowerCase()).toContain("saved drafts");
    expect(ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL.toLowerCase()).not.toContain("this device");
  });
});

describe("create-vs-review-intake-copy (TB-1461)", () => {
  it("keeps page, resume, and new-draft titles distinct from Create architecture H1", () => {
    expect(CREATE_ARCHITECTURE_LABEL).not.toBe(ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE);
    expect(CREATE_ARCHITECTURE_LABEL).not.toBe(ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE);
    expect(CREATE_ARCHITECTURE_LABEL).not.toBe(ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE);
    expect(START_NEW_ARCHITECTURE_LABEL).not.toBe(CREATE_ARCHITECTURE_LABEL);
    expect(CONTINUE_DRAFT_LABEL.toLowerCase()).toContain("draft");
  });

  it("uses architecture draft vocabulary on create-path section titles and page subtitle", () => {
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE.toLowerCase()).toContain("draft");
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE.toLowerCase()).toContain("system");
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS.toLowerCase()).toContain("continue");
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS.toLowerCase()).toContain("saved draft");
    expect(ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE.toLowerCase()).toContain("architecture draft");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE.toLowerCase()).toContain("architecture draft");
    expect(ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE.toLowerCase()).toContain("architecture draft");
  });
});

describe("create-vs-review-intake-copy — draft lead matches the fields the form renders", () => {
  it("promises only the system, outcome, and people/systems the draft form asks for", () => {
    const lead = ARCHITECTURE_DRAFT_WORKSPACE_LEAD.toLowerCase();

    expect(lead).toContain("system");
    expect(lead).toContain("outcome");
    expect(lead).toContain("people");
  });

  it("does not promise goals or tradeoff fields the draft form never renders", () => {
    const lead = ARCHITECTURE_DRAFT_WORKSPACE_LEAD.toLowerCase();

    expect(lead).not.toContain("goals");
    expect(lead).not.toContain("tradeoff");
    expect(lead).not.toContain("constraints");
  });
});
