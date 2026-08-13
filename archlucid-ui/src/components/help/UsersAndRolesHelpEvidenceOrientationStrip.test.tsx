import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsersAndRolesHelpEvidenceOrientationStrip } from "@/components/help/UsersAndRolesHelpEvidenceOrientationStrip";
import {
  USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY,
  USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  USERS_AND_ROLES_HELP_SOURCES,
} from "@/lib/users-and-roles-help-evidence-copy";

describe("UsersAndRolesHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline, as-of line, and all Sources links", () => {
    render(<UsersAndRolesHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("users-and-roles-help-claim-discipline")).toHaveTextContent(
      USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("users-and-roles-help-as-of")).toHaveTextContent(
      USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY,
    );

    for (const link of USERS_AND_ROLES_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});
