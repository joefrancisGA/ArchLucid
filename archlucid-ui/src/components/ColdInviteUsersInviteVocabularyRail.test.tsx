import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColdInviteUsersInviteVocabularyRail } from "@/components/ColdInviteUsersInviteVocabularyRail";
import {
  COLD_INVITE_USERS_INVITE_COLD_LINK,
  COLD_INVITE_USERS_INVITE_COMPACT_LINE,
  COLD_INVITE_USERS_INVITE_HEADING,
  COLD_INVITE_USERS_INVITE_USERS_LINK,
  COLD_INVITE_USERS_INVITE_WHY_TWO,
} from "@/lib/vocabulary/cold-invite-users-invite-vocabulary";

describe("ColdInviteUsersInviteVocabularyRail (TB-2276)", () => {
  it("renders cold-invite strip with peer link to users invite", () => {
    render(<ColdInviteUsersInviteVocabularyRail currentSurfaceId="cold-invite" />);

    const strip = screen.getByTestId("cold-invite-users-invite-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "cold-invite");
    expect(strip.textContent ?? "").toContain(COLD_INVITE_USERS_INVITE_COMPACT_LINE);

    const peer = screen.getByTestId("cold-invite-users-invite-vocabulary-peer-link");
    expect(peer).toHaveTextContent(COLD_INVITE_USERS_INVITE_USERS_LINK.label);
    expect(peer).toHaveAttribute("href", COLD_INVITE_USERS_INVITE_USERS_LINK.href);
  });

  it("renders users-invite strip with peer link to cold invite", () => {
    render(<ColdInviteUsersInviteVocabularyRail currentSurfaceId="users-invite" />);

    expect(screen.getByTestId("cold-invite-users-invite-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "users-invite",
    );

    const peer = screen.getByTestId("cold-invite-users-invite-vocabulary-peer-link");
    expect(peer).toHaveTextContent(COLD_INVITE_USERS_INVITE_COLD_LINK.label);
    expect(peer).toHaveAttribute("href", COLD_INVITE_USERS_INVITE_COLD_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ColdInviteUsersInviteVocabularyRail currentSurfaceId="cold-invite" variant="full" />);

    const strip = screen.getByTestId("cold-invite-users-invite-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(COLD_INVITE_USERS_INVITE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(COLD_INVITE_USERS_INVITE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("cold-invite-users-invite-vocabulary-current")).toHaveTextContent(
      COLD_INVITE_USERS_INVITE_COLD_LINK.label,
    );
  });
});
