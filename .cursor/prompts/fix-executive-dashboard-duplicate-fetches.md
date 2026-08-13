# Fix: Executive dashboard — duplicate fetches of `GET /v1/roi/executive-summary`

## Problem

Every section on the executive dashboard independently fetches the same endpoint in its own
`useEffect`, with no shared cache or deduplication. At page load, the proxy receives 4–5
concurrent `GET /v1/roi/executive-summary` requests (plus additional compliance-drift requests)
because the following client components each issue their own `fetch()` on mount:

| Component | Endpoint |
|---|---|
| `ExecutiveRoiDashboardLiveKpiCards` | `/api/proxy/v1/roi/executive-summary` |
| `BusinessImpactSummaryWidget` | `/api/proxy/v1/roi/executive-summary` |
| `ExecutiveRoiSummarySection` | `/api/proxy/v1/roi/executive-summary` |
| `ExecutiveValueNarrativeBanner` | `/api/proxy/v1/roi/executive-summary` |
| `ExecutiveRoiTrendSection` | `/api/proxy/v1/roi/executive-summary/history` |
| `ExecutiveComplianceDriftTrendSection` | via `getComplianceDriftTrend()` |
| `ExecutiveValueNarrativeBanner` | also `getComplianceDriftTrend()` + value report |

Because each component is `"use client"` and fetches in `useEffect` (post-hydration), all
fetches start in parallel. The ROI summary endpoint aggregates cost evidence and is inherently
slow. Each section then renders its own "Loading…" state and pops in separately as responses
arrive — producing the ~20 s staggered render the user sees.

The proxy timeout is 60 s (`PROXY_UPSTREAM_FETCH_TIMEOUT_MS`). N concurrent slow calls through
the same proxy add up visually even when they run in parallel, because the slowest one (often the
narrative banner, which awaits three serial calls) determines when the last section resolves.

## Fix: shared context with one coordinated fetch per data dependency

Introduce a **React context** that owns the two expensive fetches for the executive dashboard
view — the ROI summary and the compliance drift trend — fetches each once, and exposes the
`{data, loading, error}` triple to all consuming sections.

### New file: `archlucid-ui/src/components/executive/ExecutiveDashboardDataContext.tsx`

```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getComplianceDriftTrend } from "@/lib/api";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;

export type ExecutiveDashboardData = {
  summary: ExecutiveRoiSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  driftPoints: ComplianceDriftTrendPoint[];
  driftLoading: boolean;
  driftError: boolean;
};

const ExecutiveDashboardDataContext = createContext<ExecutiveDashboardData | undefined>(undefined);

function rollingBounds30Days(): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - 30);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

/** Fetches executive-summary and compliance-drift once; children read via `useExecutiveDashboardData()`. */
export function ExecutiveDashboardDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [summary, setSummary] = useState<ExecutiveRoiSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [driftPoints, setDriftPoints] = useState<ComplianceDriftTrendPoint[]>([]);
  const [driftLoading, setDriftLoading] = useState(true);
  const [driftError, setDriftError] = useState(false);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        const res = await fetch(
          EXECUTIVE_ROI_SUMMARY_PATH,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok) {
          throw new Error(`Executive summary HTTP ${res.status}`);
        }

        const json = (await res.json()) as ExecutiveRoiSummary;

        if (!canceled) {
          setSummary(json);
        }
      } catch (e: unknown) {
        if (!canceled) {
          setSummaryError(e instanceof Error ? e.message : "Failed to load executive KPIs.");
        }
      } finally {
        if (!canceled) {
          setSummaryLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    const bounds = rollingBounds30Days();

    void (async () => {
      try {
        const data = await getComplianceDriftTrend(bounds.fromUtc, bounds.toUtc, 1440);

        if (!canceled) {
          setDriftPoints(data);
        }
      } catch {
        if (!canceled) {
          setDriftError(true);
        }
      } finally {
        if (!canceled) {
          setDriftLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <ExecutiveDashboardDataContext.Provider
      value={{ summary, summaryLoading, summaryError, driftPoints, driftLoading, driftError }}
    >
      {children}
    </ExecutiveDashboardDataContext.Provider>
  );
}

/** Must be called inside `ExecutiveDashboardDataProvider`. */
export function useExecutiveDashboardData(): ExecutiveDashboardData {
  const ctx = useContext(ExecutiveDashboardDataContext);

  if (ctx === undefined) {
    throw new Error("useExecutiveDashboardData must be used within ExecutiveDashboardDataProvider");
  }

  return ctx;
}
```

### Edit `ExecutiveRoiDashboardPageView` — wrap with the provider

In `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardPageView.tsx`,
wrap the entire returned JSX in `<ExecutiveDashboardDataProvider>` when `surface === "executive"`.
For the operator surface the sections already have their own fetch logic and this is unchanged.

```tsx
import { ExecutiveDashboardDataProvider } from "@/components/executive/ExecutiveDashboardDataContext";

// In the component:
if (isExecutiveSurface) {
  return (
    <ExecutiveDashboardDataProvider>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        {/* ... existing JSX unchanged ... */}
      </div>
    </ExecutiveDashboardDataProvider>
  );
}

return (
  <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
    {/* ... existing operator JSX unchanged ... */}
  </div>
);
```

### Edit each consuming section to read from context instead of fetching

For each of the four components that independently fetch `EXECUTIVE_ROI_SUMMARY_PATH`, add a
context-aware path: if `useExecutiveDashboardData` is available (i.e. the component is rendered
inside `ExecutiveDashboardDataProvider`), use that data. Otherwise fall back to the existing
internal `useEffect` fetch so the operator-surface usage is unaffected.

The cleanest approach is to add an **optional prop** `data?: ExecutiveRoiSummary | null` and
`loading?: boolean` to each section component, and have the provider-wrapped version pass those
down. That avoids adding context coupling to components also used outside the provider.

For each of these files, add the optional props and skip the internal fetch when the prop is provided:
- `ExecutiveRoiDashboardLiveKpiCards` — add `summary?: ExecutiveRoiSummary | null; loading?: boolean`
- `BusinessImpactSummaryWidget` — same
- `ExecutiveRoiSummarySection` — same
- `ExecutiveComplianceDriftTrendSection` — add `points?: ComplianceDriftTrendPoint[]; loading?: boolean`

In `ExecutiveRoiDashboardPageView`, destructure `useExecutiveDashboardData()` and pass the values
down as props to each section. The sections retain their self-fetch behavior when props are absent
(operator surface).

`ExecutiveValueNarrativeBanner` is different — it fetches three things in parallel and computes a
narrative. Pass it `roiSummary` as an optional prop; it skips its internal `fetchExecutiveRoiSummary()`
call when the prop is provided. The compliance drift and value-report fetches inside the banner remain
because they are specific to the narrative time-window logic.

### Do not touch `ExecutiveRoiTrendSection`

It fetches `/history`, a distinct endpoint, and does not duplicate the summary. Leave it as-is.

## Acceptance criteria

1. Navigating to `/executive/dashboard` triggers **one** `GET /v1/roi/executive-summary` request
   in the browser Network tab, not four to five.
2. All sections that previously showed "Loading…" independently now share the same single loading
   state — they all resolve together when the one fetch completes.
3. The operator `/dashboard` view (non-executive surface) is **unchanged** — sections still
   fetch their own data because the provider is not mounted there.
4. `ExecutiveRoiDashboardPageView` tests (`executive/dashboard/page.test.tsx`) still pass.
5. The new context module has unit tests covering:
   - Provider mounts and exposes data to a consuming child via `useExecutiveDashboardData`.
   - Throws when `useExecutiveDashboardData` is called outside the provider.
6. No TypeScript errors: `npm run typecheck` in `archlucid-ui/` must pass.

## Guardrails

- Do not introduce SWR, React Query, or any new npm dependency. The context pattern is sufficient.
- Keep the fallback self-fetch path in each section component so they can be unit-tested in isolation.
- Do not move the `/history` fetch out of `ExecutiveRoiTrendSection` — it is not duplicated.
- Do not alter any API endpoint URLs or proxy logic.
