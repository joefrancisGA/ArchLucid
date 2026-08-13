"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  loadCurrentPrincipal,
  operatorNavOutsideProviderPrincipal,
  shellBootstrapReadPrincipal,
  type CurrentPrincipal,
} from "@/lib/current-principal";
import { publishOperatorShellPrincipalSnapshot } from "@/lib/operator/operator-shell-principal-snapshot";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

export type OperatorNavAuthorityContextValue = {
  /**
   * Full read-model from the same `loadCurrentPrincipal()` pass as `callerAuthorityRank`.
   * Prefer this in shell code over ad-hoc `/me` fetches.
   */
  currentPrincipal: CurrentPrincipal;
  /** Monotonic 1=Read, 2=Execute, 3=Admin — use with `@/lib/nav-authority` helpers. */
  callerAuthorityRank: number;
  /**
   * True only while the **first** `/api/auth/me` attempt has not settled.
   * Background focus refreshes must not flip this — `OperatorRoleGate` unmounts page content
   * when this is true, which looked like a full-page "refresh" on every window focus.
   */
  isAuthorityLoading: boolean;
};

const OperatorNavAuthorityContext = createContext<OperatorNavAuthorityContextValue | undefined>(undefined);

const DEFAULT_RANK_FULL_ACCESS = AUTHORITY_RANK.AdminAuthority;

/**
 * Resolves the operator principal via `GET /api/proxy/api/auth/me` on mount and on window focus
 * so sidebar, mobile nav, and command palette share one structural authority rank.
 * Intentionally does **not** refetch on client-side route changes — principal rarely changes per navigation;
 * repeating `/me` on every `pathname` update was a major latency source (proxy + token refresh + API).
 *
 * Focus refreshes are **stale-while-revalidate**: keep the last principal painted and update when `/me`
 * returns. Do not set `isAuthorityLoading` again after the first settlement — that flag drives
 * `OperatorRoleGate` deferral and must not blank operator pages on tab focus.
 *
 * **UI shaping only — API authoritative:** rank and principal drive **nav** (`nav-shell-visibility.ts`) and **soft**
 * affordances (`useNavCallerAuthorityRank` consumers); they do not replace **ArchLucid.Api** policies. Packaging map:
 * **docs/PRODUCT_PACKAGING.md** §3 (*Code seams* + *Contributor drift guard*).
 *
 * - **development-bypass:** uses the proxy’s server-side API key; `/me` reflects `DevelopmentBypass` dev role.
 * - **JWT + not signed in:** conservative **Read** rank without calling `/me`.
 * - **JWT + signed in:** bearer + `/me` for role claims.
 */
export function OperatorNavAuthorityProvider({ children }: { children: ReactNode }) {
  const [callerAuthorityRank, setCallerAuthorityRank] = useState(AUTHORITY_RANK.ReadAuthority);
  const [currentPrincipal, setCurrentPrincipal] = useState<CurrentPrincipal>(shellBootstrapReadPrincipal);
  const [isAuthorityLoading, setIsAuthorityLoading] = useState(true);
  const hasSettledAuthorityRef = useRef(false);
  const inFlightRefreshRef = useRef<Promise<void> | null>(null);

  const refreshCallerAuthority = useCallback(async (): Promise<void> => {
    if (inFlightRefreshRef.current !== null) {
      await inFlightRefreshRef.current;

      return;
    }

    // Only the first resolution may blank the shell; later refreshes update in place.
    if (!hasSettledAuthorityRef.current) {
      setIsAuthorityLoading(true);
    }

    const refreshPromise = (async (): Promise<void> => {
      try {
        const principal = await loadCurrentPrincipal({ bypassCache: true });

        setCallerAuthorityRank(principal.authorityRank);
        setCurrentPrincipal(principal);
        publishOperatorShellPrincipalSnapshot(principal);
        hasSettledAuthorityRef.current = true;
      } catch {
        setCallerAuthorityRank(AUTHORITY_RANK.ReadAuthority);
        setCurrentPrincipal(shellBootstrapReadPrincipal);
        hasSettledAuthorityRef.current = true;
      } finally {
        setIsAuthorityLoading(false);
        inFlightRefreshRef.current = null;
      }
    })();

    inFlightRefreshRef.current = refreshPromise;
    await refreshPromise;
  }, []);

  useEffect(() => {
    void refreshCallerAuthority();
  }, [refreshCallerAuthority]);

  useEffect(() => {
    const onFocus = (): void => {
      void refreshCallerAuthority();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCallerAuthority]);

  const value = useMemo<OperatorNavAuthorityContextValue>(
    () => ({ currentPrincipal, callerAuthorityRank, isAuthorityLoading }),
    [currentPrincipal, callerAuthorityRank, isAuthorityLoading],
  );

  return <OperatorNavAuthorityContext.Provider value={value}>{children}</OperatorNavAuthorityContext.Provider>;
}

/**
 * Returns the shared caller authority rank for nav filtering.
 * When used outside `OperatorNavAuthorityProvider` (e.g. unit tests), defaults to **Admin** rank so links stay visible.
 */
export function useOperatorNavAuthority(): OperatorNavAuthorityContextValue {
  const ctx = useContext(OperatorNavAuthorityContext);

  if (ctx === undefined) {
    return {
      currentPrincipal: operatorNavOutsideProviderPrincipal,
      callerAuthorityRank: DEFAULT_RANK_FULL_ACCESS,
      isAuthorityLoading: false,
    };
  }

  return ctx;
}

/**
 * Rank used for **filtering** nav links: while the **initial** JWT `/me` is in flight for a signed-in session,
 * stay conservative (Read) so Operator-only destinations do not flash for Reader before claims resolve.
 * After the first settlement, background focus refreshes keep the last known rank until `/me` returns.
 *
 * @see `OperatorNavAuthorityProvider.test.tsx` — refetch + `/me` failure regressions.
 */
export function useNavCallerAuthorityRank(): number {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();

  if (isAuthorityLoading && isJwtAuthMode() && isLikelySignedIn()) {
    return AUTHORITY_RANK.ReadAuthority;
  }

  return callerAuthorityRank;
}

/**
 * Whether the scoped tenant already completed a committed golden-manifest review (`GET /api/proxy/api/auth/me`).
 * Use with **`useNavCallerAuthorityRank`** wherever **`listNavGroupsVisibleInOperatorShell`** is composed.
 *
 * Synthetic principals from **`loadCurrentPrincipal`**: **`me-http` / `me-network` / non-browser** preserve **true** so a
 * transport glitch does not trap users in thin nav; **jwt-unsigned** stays **false**; bootstrap shell defaults **false** until **`/me`** settles.
 */
export function useNavCommittedArchitectureReview(): boolean {
  const { currentPrincipal } = useOperatorNavAuthority();

  return currentPrincipal.hasCommittedArchitectureReview;
}
