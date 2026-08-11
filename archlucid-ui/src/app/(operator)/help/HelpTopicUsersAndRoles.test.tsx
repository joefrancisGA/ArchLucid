import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const useNavCallerAuthorityRank = vi.hoisted(() => vi.fn(() => 1));
const mockIsAuthorityLoading = vi.hoisted(() => vi.fn(() => false));
const mockPrimaryAppRole = vi.hoisted(() => vi.fn((): "Admin" | "Operator" | "Reader" | "Auditor" => "Reader"));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => useNavCallerAuthorityRank(),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: useNavCallerAuthorityRank(),
      primaryAppRole: mockPrimaryAppRole(),
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: useNavCallerAuthorityRank(),
    isAuthorityLoading: mockIsAuthorityLoading(),
  }),
}));

import { HelpUsersAndRolesGuideView } from "@/app/(operator)/help/_sections/HelpUsersAndRolesGuideView";
import {
  USERS_AND_ROLES_AUTHORITY_LOADING_LABEL,
  USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING,
  USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING,
  USERS_AND_ROLES_MANAGE_ACTION_LABEL,
  USERS_AND_ROLES_PAGE_INTRO,
  USERS_AND_ROLES_PAGE_TITLE,
  USERS_AND_ROLES_ROLE_OVERVIEW_HASH,
  USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL,
  USERS_AND_ROLES_UNAUTHORIZED_BODY,
  USERS_AND_ROLES_UNAUTHORIZED_NEXT_STEP_LABEL,
} from "@/lib/users-and-roles-help-copy";
import {
  USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS,
  USERS_AND_ROLES_CONTRACT_VERSION,
  USERS_AND_ROLES_GUIDE_HEADINGS,
} from "@/lib/users-and-roles-help-manifest";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import {
  USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY,
  USERS_AND_ROLES_HELP_CANONICAL_PATH,
  USERS_AND_ROLES_HELP_SOURCES,
} from "@/lib/users-and-roles-help-evidence-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

describe("HelpUsersAndRolesGuideView", () => {
  const entry = getProductDocumentationEntry("users-and-roles");

  beforeEach(() => {
    mockIsAuthorityLoading.mockReturnValue(false);
    useNavCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.ReadAuthority);
    mockPrimaryAppRole.mockReturnValue("Reader");
  });

  it("registers the users and roles help entry", () => {
    expect(entry?.slug).toBe("users-and-roles");
    expect(entry?.title).toBe(USERS_AND_ROLES_PAGE_TITLE);
    // Legacy slug redirects before registry lookup (TB-1707); catalog keeps alias retired (TB-2050).
    expect(getProductDocumentationEntry("operator-auth-roles")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
  });

  it("renders one H1, breadcrumb, TOC rail, and customer intro without internal engineering sections", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: USERS_AND_ROLES_PAGE_TITLE })).toHaveLength(1);
    expect(screen.getByText(USERS_AND_ROLES_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("help-users-and-roles-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-users-and-roles-breadcrumb")).toHaveTextContent(USERS_AND_ROLES_PAGE_TITLE);
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-role-overview-table")).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-capability-matrix")).toBeInTheDocument();

    const rendered = document.body.textContent ?? "";

    for (const pattern of USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS) {
      expect(rendered).not.toMatch(pattern);
    }
  });

  it("shows primary manage action for administrators and actionable guidance for read-tier callers", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    mockIsAuthorityLoading.mockReturnValue(false);
    useNavCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.AdminAuthority);
    const { rerender } = render(<HelpUsersAndRolesGuideView entry={entry} />);

    const manageLink = screen.getByRole("link", { name: USERS_AND_ROLES_MANAGE_ACTION_LABEL });

    expect(manageLink).toHaveAttribute("href", SETTINGS_USERS_USERS_TAB_PATH);
    expect(manageLink.className).toContain("bg-");

    useNavCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.ReadAuthority);
    mockPrimaryAppRole.mockReturnValue("Reader");
    rerender(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getByTestId("users-and-roles-unauthorized-action")).toHaveTextContent(USERS_AND_ROLES_UNAUTHORIZED_BODY);
    expect(screen.getByTestId("users-and-roles-current-role")).toHaveTextContent("Reader");
    expect(screen.getByRole("link", { name: USERS_AND_ROLES_UNAUTHORIZED_NEXT_STEP_LABEL })).toHaveAttribute(
      "href",
      USERS_AND_ROLES_ROLE_OVERVIEW_HASH,
    );
    expect(screen.queryByRole("link", { name: USERS_AND_ROLES_MANAGE_ACTION_LABEL })).toBeNull();
  });

  it("does not flash Reader guidance while authority is still loading", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    mockIsAuthorityLoading.mockReturnValue(true);
    useNavCallerAuthorityRank.mockReturnValue(AUTHORITY_RANK.ReadAuthority);
    mockPrimaryAppRole.mockReturnValue("Admin");

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getByTestId("users-and-roles-authority-loading")).toHaveTextContent(
      USERS_AND_ROLES_AUTHORITY_LOADING_LABEL,
    );
    expect(screen.queryByTestId("users-and-roles-unauthorized-action")).toBeNull();
    expect(screen.queryByRole("link", { name: USERS_AND_ROLES_MANAGE_ACTION_LABEL })).toBeNull();
  });

  it("lists built-in roles, capability matrix provenance, and links to security and trust", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    const overview = screen.getByTestId("users-and-roles-role-overview-table");
    expect(within(overview).getByText("Admin")).toBeInTheDocument();
    expect(within(overview).getByText("Architect")).toBeInTheDocument();
    expect(within(overview).getByText("Reader")).toBeInTheDocument();
    expect(within(overview).getByText("Auditor")).toBeInTheDocument();

    expect(screen.getByTestId("users-and-roles-help-as-of")).toHaveTextContent(USERS_AND_ROLES_CONTRACT_VERSION);
    expect(screen.getByTestId("users-and-roles-help-as-of")).toHaveTextContent(USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY);

    const sources = screen.getByTestId("users-and-roles-help-sources");

    for (const link of USERS_AND_ROLES_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getAllByRole("link", { name: USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL })).toHaveLength(2);
  });

  it("uses accessible table headers for the capability matrix and aligns TOC with section ids", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    const matrix = screen.getByTestId("users-and-roles-capability-matrix");
    expect(within(matrix).getByRole("columnheader", { name: "Capability" })).toBeInTheDocument();
    expect(within(matrix).getByRole("columnheader", { name: "Admin" })).toBeInTheDocument();
    expect(within(matrix).getByLabelText("Finalize reviews for Reader: Not allowed")).toBeInTheDocument();

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING })).toHaveAttribute(
      "href",
      "#how-access-works",
    );
    expect(within(toc).getByRole("link", { name: USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING })).toHaveAttribute(
      "href",
      "#capability-matrix",
    );
    expect(USERS_AND_ROLES_GUIDE_HEADINGS.length).toBeGreaterThanOrEqual(4);
  });
});
