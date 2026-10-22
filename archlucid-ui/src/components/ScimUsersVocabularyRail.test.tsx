import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScimUsersVocabularyRail } from "@/components/ScimUsersVocabularyRail";
import {
  SCIM_USERS_COMPACT_LINE,
  SCIM_USERS_HEADING,
  SCIM_USERS_SCIM_LINK,
  SCIM_USERS_USERS_LINK,
  SCIM_USERS_WHY_TWO,
} from "@/lib/vocabulary/scim-users-vocabulary";

describe("ScimUsersVocabularyRail (TB-2321)", () => {
  it("renders scim strip with peer link to users", () => {
    render(<ScimUsersVocabularyRail currentSurfaceId="scim" />);

    const strip = screen.getByTestId("scim-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "scim");
    expect(strip.textContent ?? "").toContain(SCIM_USERS_COMPACT_LINE);

    const peer = screen.getByTestId("scim-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SCIM_USERS_USERS_LINK.label);
    expect(peer).toHaveAttribute("href", SCIM_USERS_USERS_LINK.href);
  });

  it("renders users strip with peer link to scim", () => {
    render(<ScimUsersVocabularyRail currentSurfaceId="users" />);

    expect(screen.getByTestId("scim-users-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "users",
    );

    const peer = screen.getByTestId("scim-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SCIM_USERS_SCIM_LINK.label);
    expect(peer).toHaveAttribute("href", SCIM_USERS_SCIM_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ScimUsersVocabularyRail currentSurfaceId="scim" variant="full" />);

    const strip = screen.getByTestId("scim-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(SCIM_USERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SCIM_USERS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("scim-users-vocabulary-current")).toHaveTextContent(
      SCIM_USERS_SCIM_LINK.label,
    );
  });
});
