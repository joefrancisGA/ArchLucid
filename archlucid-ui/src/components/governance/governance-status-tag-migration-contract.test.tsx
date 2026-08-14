import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";

const SRC_ROOT = join(process.cwd(), "src");

const TB_2286_MIGRATED_MODULES = [
  "app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx",
  "components/governance/GovernanceApprovalInspectorPreview.tsx",
  "components/runs/RunDetailPageHeader.tsx",
  "components/runs/RunDetailOutcomeCards.tsx",
] as const;

describe("TB-2286 governance StatusTag migration contract", () => {
  it.each(TB_2286_MIGRATED_MODULES)("does not import StatusPill from %s", (relativePath) => {
    const source = readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");

    expect(source).not.toMatch(/from ["']@\/components\/StatusPill["']/);
    expect(source).toContain("GovernanceStatusTag");
  });
});

describe("GovernanceStatusTag", () => {
  it("renders StatusTag with governance resolver kind and left-accent shell", () => {
    render(<GovernanceStatusTag status="Submitted" aria-label="Governance status: Submitted" />);

    const tag = screen.getByLabelText("Governance status: Submitted");

    expect(tag).toHaveTextContent("Submitted");
    expect(tag.className).toContain("border-l-[3px]");
  });

  it("maps buyer-polished pending review label to in-progress", () => {
    render(<GovernanceStatusTag status="Pending architecture review" />);

    const tag = screen.getByLabelText("Status: Pending architecture review");

    expect(tag.className).toContain("border-l-sky-700");
  });
});
