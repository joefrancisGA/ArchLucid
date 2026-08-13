/**
 * `useNavCallerAuthorityRank` is the conservative rank fed into nav filtering and Enterprise mutation hooks while the
 * **initial** JWT `/me` is in flight. A regression here causes Execute-tier destinations or write affordances to flash
 * before claims resolve (see `OperatorNavAuthorityProvider` implementation comments).
 *
 * Focus-driven refreshes must stay stale-while-revalidate: keep the last rank and never flip `isAuthorityLoading`
 * again — that flag blanks page content via `OperatorRoleGate`.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeAuthMeResponse, type CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const loadCurrentPrincipalMock = vi.hoisted(() => vi.fn());
let fetchCount = 0;

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: (): boolean => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: (): boolean => true,
}));

vi.mock("@/lib/current-principal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/current-principal")>();

  return {
    ...actual,
    loadCurrentPrincipal: (): Promise<CurrentPrincipal> => loadCurrentPrincipalMock(),
  };
});

import {
  OperatorNavAuthorityProvider,
  useNavCallerAuthorityRank,
  useOperatorNavAuthority,
} from "@/components/operator/OperatorNavAuthorityProvider";

function RankProbe() {
  const rank = useNavCallerAuthorityRank();

  return <span data-testid="nav-caller-rank">{rank}</span>;
}

function AuthorityLoadingProbe() {
  const { isAuthorityLoading } = useOperatorNavAuthority();

  return <span data-testid="authority-loading">{isAuthorityLoading ? "yes" : "no"}</span>;
}

describe("OperatorNavAuthorityProvider", () => {
  beforeEach(() => {
    fetchCount = 0;
    loadCurrentPrincipalMock.mockReset();
    loadCurrentPrincipalMock.mockImplementation(async () => {
      fetchCount += 1;

      if (fetchCount === 1) {
        return normalizeAuthMeResponse({ claims: [{ type: "roles", value: "Operator" }] });
      }

      return new Promise<CurrentPrincipal>(() => {
        /* hang: simulates slow /me on a subsequent refresh while prior rank was already Execute */
      });
    });
  });

  it("keeps Execute rank and does not re-enter loading during focus-driven /me refresh", async () => {
    render(
      <OperatorNavAuthorityProvider>
        <RankProbe />
        <AuthorityLoadingProbe />
      </OperatorNavAuthorityProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("nav-caller-rank")).toHaveTextContent(String(AUTHORITY_RANK.ExecuteAuthority));
      expect(screen.getByTestId("authority-loading")).toHaveTextContent("no");
    });

    loadCurrentPrincipalMock.mockImplementation(async () => {
      fetchCount += 1;

      return new Promise<CurrentPrincipal>(() => {
        /* hang: simulates slow /me during focus-driven refresh while prior rank was already Execute */
      });
    });

    window.dispatchEvent(new Event("focus"));

    await waitFor(() => {
      expect(fetchCount).toBeGreaterThanOrEqual(2);
    });

    expect(screen.getByTestId("nav-caller-rank")).toHaveTextContent(String(AUTHORITY_RANK.ExecuteAuthority));
    expect(screen.getByTestId("authority-loading")).toHaveTextContent("no");
  });

  it("resolves to Execute rank after /me returns Operator", async () => {
    loadCurrentPrincipalMock.mockImplementation(async () =>
      normalizeAuthMeResponse({ claims: [{ type: "roles", value: "Operator" }] }),
    );

    render(
      <OperatorNavAuthorityProvider>
        <RankProbe />
      </OperatorNavAuthorityProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("nav-caller-rank")).toHaveTextContent(String(AUTHORITY_RANK.ExecuteAuthority));
    });
  });

  it("falls back to Read rank when /me rejects", async () => {
    loadCurrentPrincipalMock.mockRejectedValueOnce(new Error("network"));

    render(
      <OperatorNavAuthorityProvider>
        <RankProbe />
      </OperatorNavAuthorityProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("nav-caller-rank")).toHaveTextContent(String(AUTHORITY_RANK.ReadAuthority));
    });
  });

  it("uses conservative Read rank while the initial JWT /me is still in flight", async () => {
    loadCurrentPrincipalMock.mockImplementation(
      () =>
        new Promise<CurrentPrincipal>(() => {
          /* hang: initial /me never settles */
        }),
    );

    render(
      <OperatorNavAuthorityProvider>
        <RankProbe />
        <AuthorityLoadingProbe />
      </OperatorNavAuthorityProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authority-loading")).toHaveTextContent("yes");
    });

    expect(screen.getByTestId("nav-caller-rank")).toHaveTextContent(String(AUTHORITY_RANK.ReadAuthority));
  });
});
