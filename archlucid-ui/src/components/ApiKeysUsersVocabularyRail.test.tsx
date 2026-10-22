import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeysUsersVocabularyRail } from "@/components/ApiKeysUsersVocabularyRail";
import {
  API_KEYS_USERS_API_KEYS_LINK,
  API_KEYS_USERS_COMPACT_LINE,
  API_KEYS_USERS_HEADING,
  API_KEYS_USERS_USERS_LINK,
  API_KEYS_USERS_WHY_TWO,
} from "@/lib/vocabulary/api-keys-users-vocabulary";

describe("ApiKeysUsersVocabularyRail (TB-2327)", () => {
  it("renders api-keys strip with peer link to users", () => {
    render(<ApiKeysUsersVocabularyRail currentSurfaceId="api-keys" />);

    const strip = screen.getByTestId("api-keys-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "api-keys");
    expect(strip.textContent ?? "").toContain(API_KEYS_USERS_COMPACT_LINE);

    const peer = screen.getByTestId("api-keys-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(API_KEYS_USERS_USERS_LINK.label);
    expect(peer).toHaveAttribute("href", API_KEYS_USERS_USERS_LINK.href);
  });

  it("renders users strip with peer link to API keys", () => {
    render(<ApiKeysUsersVocabularyRail currentSurfaceId="users" />);

    expect(screen.getByTestId("api-keys-users-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "users",
    );

    const peer = screen.getByTestId("api-keys-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(API_KEYS_USERS_API_KEYS_LINK.label);
    expect(peer).toHaveAttribute("href", API_KEYS_USERS_API_KEYS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ApiKeysUsersVocabularyRail currentSurfaceId="api-keys" variant="full" />);

    const strip = screen.getByTestId("api-keys-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(API_KEYS_USERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(API_KEYS_USERS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-users-vocabulary-current")).toHaveTextContent(
      API_KEYS_USERS_API_KEYS_LINK.label,
    );
  });
});
