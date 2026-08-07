import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsersAndRolesHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/UsersAndRolesHelpEvidenceOrientationStrip";
import {
  USERS_AND_ROLES_HELP_CANONICAL_PATH,
  USERS_AND_ROLES_HELP_SOURCES,
} from "@/lib/users-and-roles-help-evidence-copy";

describe("UsersAndRolesHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking users-and-roles help", () => {
    render(<UsersAndRolesHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("users-and-roles-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("users-and-roles-help-claim-discipline")).toBeInTheDocument();

    for (const link of USERS_AND_ROLES_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(USERS_AND_ROLES_HELP_SOURCES.some((link) => link.href === USERS_AND_ROLES_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
