import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 1,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      authorityRank: 1,
      primaryAppRole: "Reader",
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 1,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { HelpUsersAndRolesGuideView } from "@/app/(operator)/help/_sections/HelpUsersAndRolesGuideView";
import { SECURENOW_USERS_AND_ROLES_WORKSPACE_PARTICIPATION_HEADING } from "@/lib/users-and-roles-help-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SECURENOW_USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  SECURENOW_USERS_AND_ROLES_HELP_SOURCES,
} from "@/lib/users-and-roles-help-evidence-copy";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpUsersAndRolesGuideView SecureNow shell", () => {
  const entry = getProductDocumentationEntry("users-and-roles");

  it("orients operators without architecture review participation or billing capability rows", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: SECURENOW_USERS_AND_ROLES_WORKSPACE_PARTICIPATION_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-help-claim-discipline")).toHaveTextContent(
      SECURENOW_USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
    );

    const matrix = screen.getByTestId("users-and-roles-capability-matrix");
    expect(within(matrix).queryByText("Finalize reviews")).toBeNull();
    expect(within(matrix).queryByText("Manage billing")).toBeNull();
    expect(within(matrix).getByText("View findings, inventory, and audit lineage")).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-faq-billing")).toHaveTextContent("not administered in SecureNow");

    const sources = screen.getByTestId("users-and-roles-help-sources");
    expectWhereToGoNextFollowUpLinks(within(sources), SECURENOW_USERS_AND_ROLES_HELP_SOURCES);

    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toMatch(/sign off on architecture reviews/i);
    expect(rendered).not.toMatch(/finalize reviews for Reader/i);
  });
});
