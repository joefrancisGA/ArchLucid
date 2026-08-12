import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE,
  ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE,
  ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
  ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD,
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
  it("discloses device-local scope without implying session-only loss", () => {
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("this device");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("close the browser");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("not a shared tenant-wide");

    expect(ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE.toLowerCase()).toContain("this device");
    expect(ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE.toLowerCase()).toContain("other browsers");
  });

  it("aligns view-all drafts label with architectures hub honesty", () => {
    expect(ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL.toLowerCase()).toContain("this device");
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
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE.toLowerCase()).toContain("architecture draft");
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE.toLowerCase()).toContain("new draft");
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS.toLowerCase()).toContain("continue");
    expect(ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS.toLowerCase()).toContain("saved architecture draft");
    expect(ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD.toLowerCase()).toContain("continue");
    expect(ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE.toLowerCase()).toContain("architecture draft");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE.toLowerCase()).toContain("architecture draft");
    expect(ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE.toLowerCase()).toContain("architecture draft");
  });
});
