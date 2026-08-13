import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeysVsUsersReconciler } from "@/components/ApiKeysVsUsersReconciler";
import {
  API_KEYS_VS_USERS_API_KEYS_LINK,
  API_KEYS_VS_USERS_COMPACT_LINE,
  API_KEYS_VS_USERS_HEADING,
  API_KEYS_VS_USERS_USERS_LINK,
  API_KEYS_VS_USERS_WHY_TWO,
} from "@/lib/api-keys-vs-users";

describe("ApiKeysVsUsersReconciler (TB-2237 / TB-2327)", () => {
  it("renders compact strip on API keys with peer link to users", () => {
    render(<ApiKeysVsUsersReconciler currentSurfaceId="api-keys" />);

    const strip = screen.getByTestId("api-keys-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "api-keys");
    expect(strip.textContent ?? "").toContain(API_KEYS_VS_USERS_COMPACT_LINE);

    const peer = screen.getByTestId("api-keys-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(API_KEYS_VS_USERS_USERS_LINK.label);
    expect(peer).toHaveAttribute("href", API_KEYS_VS_USERS_USERS_LINK.href);
  });

  it("renders compact strip on users with peer link to API keys", () => {
    render(<ApiKeysVsUsersReconciler currentSurfaceId="users" />);

    expect(screen.getByTestId("api-keys-users-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "users",
    );

    const peer = screen.getByTestId("api-keys-users-vocabulary-peer-link");
    expect(peer).toHaveTextContent(API_KEYS_VS_USERS_API_KEYS_LINK.label);
    expect(peer).toHaveAttribute("href", API_KEYS_VS_USERS_API_KEYS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ApiKeysVsUsersReconciler currentSurfaceId="api-keys" variant="full" />);

    const strip = screen.getByTestId("api-keys-users-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(API_KEYS_VS_USERS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(API_KEYS_VS_USERS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-users-vocabulary-current")).toHaveTextContent(
      API_KEYS_VS_USERS_API_KEYS_LINK.label,
    );
  });
});
