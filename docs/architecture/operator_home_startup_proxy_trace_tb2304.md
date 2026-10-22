# Operator home startup proxy trace (TB-2304)

**Status:** Baseline committed 2026-08-19 (performance TB-2304).  
**Scope:** Browser `GET` calls through the Next.js UI proxy from sign-in through operator home (`/`) first paint.  
**Not in scope:** RSC/server fetches (e.g. runs dashboard model), Playwright perf CI (**G-QA-06**), production RUM.

> **ID note:** Performance **TB-2304** is distinct from vocabulary rail **TB-2304** (`package-governance-approval-queue-vocabulary.ts`).

## Before / after (2026-08-14 shell-status wave)

| Phase | Unique proxy GET paths (cold `/`) | Duplicate shell-status concerns | Serial chains |
|-------|----------------------------------|---------------------------------|---------------|
| Pre shell-status (2026-08-13 audit) | 12+ (trial, migration, LLM budget, alerts inbox, usage, homepage, stickiness, assigned-to-me, reviews-awaiting-action, …) | Each concern fired its own GET in parallel with shell-status bootstrap | Multiple waves: shell concerns → preferences → health |
| Post shell-status (2026-08-14 + TB-2303) | **3–5** | **0** (hydrated from `GET /v1/operator/shell-status`) | shell-status → preferences (+ optional health/baseline) |

## Committed cold-start budget

Source: `archlucid-ui/performance/operator-home-startup-proxy-trace-baseline.v1.json`

| Path | Allowed count (cold start) | Notes |
|------|---------------------------|-------|
| `/v1/operator/shell-status` | 1 | Aggregates trial, migration, LLM budget, alerts inbox, usage, homepage, stickiness, assigned-to-me count, reviews-awaiting-action |
| `/v1/user/preferences` | 0–1 | TanStack bridge (**TB-2303**) — at most one per session window |
| `/health/ready` | 0–1 | Setup health banner (anonymous readiness) |
| `/v1/tenant/baseline` | 0–1 | Pilot ROI / sponsor baseline completeness when surfaced on home |
| Shell-status hydrated paths (see baseline JSON) | **0** | Regression if any duplicate GET appears after hydration |

**Total proxy GET budget:** 5 (+2 regression tolerance).

## TB-2302 bootstrap mega-bundle go/no-go

**Decision: no-go** (2026-08-19).

Cold operator-home load fits the 3–5 GET budget without a `GET /v1/operator/bootstrap` mega-bundle. Re-open **TB-2302** only if:

1. A fresh dev trace exceeds the committed budget after intentional new home surfaces ship, or
2. Duplicate shell-status concern GETs return (hydration regression), or
3. A new serial chain adds measurable first-paint latency that bundling would collapse.

## Capture procedure (dev)

1. Start API + UI locally (`npm run dev` in `archlucid-ui`, API per `docs/engineering/AGENTS.md`).
2. Sign in as a tenant with operator home (Claims Intake Demo if available).
3. Clear site data / hard refresh on `/`.
4. Record proxy `GET` paths until home first paint (DevTools Network filtered to `/api/proxy/`).
5. Save JSON:

```json
{
  "capturedUtc": "<ISO-8601>",
  "route": "/",
  "entries": [
    { "path": "/api/proxy/v1/operator/shell-status", "method": "GET", "startedAtMs": 0 }
  ]
}
```

6. Compare:

```bash
cd archlucid-ui
npm run check:operator-home-proxy-trace -- --trace path/to/capture.json
```

Or use `scripts/dev/capture-operator-home-proxy-trace.ps1` to scaffold a capture file from clipboard paths.

## Regression checklist (future home changes)

- [ ] `npm run check:operator-home-proxy-trace` passes on a fresh capture
- [ ] `operator-shell-status-concern-gate-drift-guard.test.ts` passes (new concern consumers inventoried)
- [ ] No duplicate GET for paths listed in `shellStatusHydratedPaths` on cold start
- [ ] `GET /v1/user/preferences` ≤ 1 per session window on cold start
- [ ] Re-evaluate TB-2302 go/no-go if total GETs exceed budget + tolerance

## Related

- `OperatorShellStatusQueryGate` + `fetchAndHydrateOperatorShellStatus`
- `operator-shell-status-concern-gate-source-patterns.ts` (gated hook inventory)
- **TB-2302** (bootstrap mega-bundle — blocked on this baseline)
- **TB-2303** (user preferences TanStack bridge)
