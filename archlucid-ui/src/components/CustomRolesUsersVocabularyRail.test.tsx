import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomRolesUsersVocabularyRail } from "@/components/CustomRolesUsersVocabularyRail";
import {
  CUSTOM_ROLES_USERS_COMPACT_LINE,
  CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK,
  CUSTOM_ROLES_USERS_HEADING,
  CUSTOM_ROLES_USERS_USERS_LINK,
  CUSTOM_ROLES_USERS_WHY_TWO,
} from "@/lib/vocabulary/custom-roles-users-vocabulary";

describe("CustomRolesUsersVocabularyRail (TB-2262)", () => {
  it("renders custom-roles strip with peer link to users", () => {
    render(<CustomRolesUsersVocabularyRail currentSurfaceId="custom-roles" />);

    const strip = screen.getByTestId("custom-roles-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "custom-roles");
    expect(strip.textContent ?? "").toContain(CUSTOM_ROLES_USERS_COMPACT_LINE);

    const peer = screen.getByTestId("custom-roles-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CUSTOM_ROLES_USERS_USERS_LINK.label);
    expect(peer).toHaveAttribute("href", CUSTOM_ROLES_USERS_USERS_LINK.href);
  });

  it("renders users strip with peer link to custom roles", () => {
    render(<CustomRolesUsersVocabularyRail currentSurfaceId="users" />);

    expect(screen.getByTestId("custom-roles-users-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "users",
    );

    const peer = screen.getByTestId("custom-roles-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK.label);
    expect(peer).toHaveAttribute("href", CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <CustomRolesUsersVocabularyRail currentSurfaceId="custom-roles" variant="full" />,
    );

    const strip = screen.getByTestId("custom-roles-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(CUSTOM_ROLES_USERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(CUSTOM_ROLES_USERS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("custom-roles-users-vocabulary-current")).toHaveTextContent(
      CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK.label,
    );
  });
});
