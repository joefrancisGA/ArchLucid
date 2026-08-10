import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 1));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: useNavCallerAuthorityRank,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: useNavCallerAuthorityRank,
    isAuthorityLoading: false,
  }),
}));

import { HelpUsersAndRolesGuideView } from "@/app/(operator)/help/_sections/HelpUsersAndRolesGuideView";
import {
  USERS_AND_ROLES_MANAGE_ACTION_LABEL,
  USERS_AND_ROLES_PAGE_INTRO,
  USERS_AND_ROLES_PAGE_TITLE,
  USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL,
  USERS_AND_ROLES_UNAUTHORIZED_ACTION,
} from "@/lib/users-and-roles-help-copy";
import { USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS } from "@/lib/users-and-roles-help-manifest";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

describe("HelpUsersAndRolesGuideView", () => {
  const entry = getProductDocumentationEntry("users-and-roles");

  it("registers the users and roles help entry", () => {
    expect(entry?.slug).toBe("users-and-roles");
    expect(entry?.title).toBe(USERS_AND_ROLES_PAGE_TITLE);
    // Legacy slug redirects before registry lookup (TB-1707); catalog keeps alias retired (TB-2050).
    expect(getProductDocumentationEntry("operator-auth-roles")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
  });

  it("renders one H1 and customer intro without internal engineering sections", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: USERS_AND_ROLES_PAGE_TITLE })).toHaveLength(1);
    expect(screen.getByText(USERS_AND_ROLES_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-role-overview-table")).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-capability-matrix")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).toBeNull();

    const rendered = document.body.textContent ?? "";

    for (const pattern of USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS) {
      expect(rendered).not.toMatch(pattern);
    }
  });

  it("shows manage action for administrators and guidance for read-tier callers", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    useNavCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.AdminAuthority);
    const { rerender } = render(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: USERS_AND_ROLES_MANAGE_ACTION_LABEL })).toHaveAttribute(
      "href",
      SETTINGS_USERS_USERS_TAB_PATH,
    );

    useNavCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.ReadAuthority);
    rerender(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getByTestId("users-and-roles-unauthorized-action")).toHaveTextContent(
      USERS_AND_ROLES_UNAUTHORIZED_ACTION,
    );
    expect(screen.queryByRole("link", { name: USERS_AND_ROLES_MANAGE_ACTION_LABEL })).toBeNull();
  });

  it("lists built-in roles and links to security and trust", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    const overview = screen.getByTestId("users-and-roles-role-overview-table");
    expect(within(overview).getByText("Admin")).toBeInTheDocument();
    expect(within(overview).getByText("Architect")).toBeInTheDocument();
    expect(within(overview).getByText("Reader")).toBeInTheDocument();
    expect(within(overview).getByText("Auditor")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL })).toHaveAttribute(
      "href",
      "/help/security-trust",
    );
  });

  it("uses accessible table headers for the capability matrix", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    const matrix = screen.getByTestId("users-and-roles-capability-matrix");
    expect(within(matrix).getByRole("columnheader", { name: "Capability" })).toBeInTheDocument();
    expect(within(matrix).getByRole("columnheader", { name: "Admin" })).toBeInTheDocument();
    expect(within(matrix).getByLabelText("Finalize reviews for Reader: Not allowed")).toBeInTheDocument();
  });
});