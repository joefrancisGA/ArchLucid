import { render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



import {

  buildGovernanceAssignedToMeEmptyDescription,

  formatGovernanceAssignedToMeCheckedAtRelative,

  formatGovernanceAssignedToMeIdentityAttestation,

  resolveGovernanceAssignedToMeAssigneeLabel,

  resolveGovernanceAssignedToMeWorkspaceLabel,

} from "@/lib/governance/governance-assigned-to-me-empty-state";
import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";

import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";



const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;



describe("governance-assigned-to-me-empty-state", () => {

  it("formats checked-at timestamps as relative age", () => {

    const checkedAt = new Date("2026-08-14T18:03:00.000Z");

    const nowMs = new Date("2026-08-14T18:05:00.000Z").getTime();



    expect(formatGovernanceAssignedToMeCheckedAtRelative(checkedAt, nowMs)).toBe("2 minutes ago");

  });



  it("names assignee role, workspace, basis, and freshness in the empty description", () => {

    render(

      <>

        {buildGovernanceAssignedToMeEmptyDescription(

          {

            assigneeDisplayName: "Jordan Lee",

            assigneeRoleLabel: "Architect",

            checkedAt: new Date("2026-08-14T18:03:00.000Z"),

            fetchBasis: "register-only",

          },

          { nowMs: new Date("2026-08-14T18:05:00.000Z").getTime() },

        )}

      </>,

    );



    expect(screen.getByText(/Jordan Lee \(Architect\)/)).toBeInTheDocument();

    expect(screen.getByText(new RegExp(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL))).toBeInTheDocument();

    expect(screen.getByTestId("governance-assigned-to-me-empty-basis")).toHaveTextContent(

      /assigned-to-me risk register only/i,

    );

    expect(screen.getByTestId("governance-assigned-to-me-empty-basis")).toHaveTextContent(

      /Closed findings and findings assigned to other operators are excluded/i,

    );

    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");



    const checkedAt = screen.getByTestId("governance-assigned-to-me-empty-checked-at");

    expect(checkedAt).toHaveTextContent("Checked 2 minutes ago");

    const time = checkedAt.querySelector("time");

    expect(time).toHaveAttribute("dateTime", "2026-08-14T18:03:00.000Z");

    expect(time).toHaveAttribute("aria-label");

    expect(time).not.toHaveAttribute("title");

  });



  it("falls back to neutral labels when identity fields are missing", () => {

    expect(resolveGovernanceAssignedToMeAssigneeLabel(null)).toBe("you");

    expect(formatGovernanceAssignedToMeIdentityAttestation("", null)).toBe("you");

    expect(resolveGovernanceAssignedToMeWorkspaceLabel()).toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);

  });



  it("does not leak raw workspace ids when localStorage is empty under dev-default scope", () => {

    vi.spyOn(operatorScopeStorage, "readOperatorScopeFromStorage").mockReturnValue(null);



    render(

      <>

        {buildGovernanceAssignedToMeEmptyDescription({

          assigneeDisplayName: "Jordan Lee",

          checkedAt: new Date("2026-08-14T18:05:00.000Z"),

        })}

      </>,

    );



    const workspaceLine = screen.getByText(/No open findings are assigned to/);

    const checkedAt = screen.getByTestId("governance-assigned-to-me-empty-checked-at");



    expect(workspaceLine.textContent ?? "").not.toMatch(UUID_PATTERN);

    expect(checkedAt.textContent ?? "").not.toMatch(UUID_PATTERN);

    expect(screen.getByText(new RegExp(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL))).toBeInTheDocument();

  });

});


