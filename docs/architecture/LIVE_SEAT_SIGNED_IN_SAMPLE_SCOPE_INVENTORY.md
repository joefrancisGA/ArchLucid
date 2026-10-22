# Live seat — signed-in sample scope inventory (LS-002)

**Purpose:** List every path that can put a **signed-in** operator on Customer Intake Demo / dev-default / pinned demo scope **without** an explicit Training choice or `visitSampleWorkspaceScope()` sample visit.

**Related:** ADR 0102, `operator-scope-bootstrap.ts`, LS-010 scope-header fix.

## Intentional vs silent

| Build | Signed-in? | Expected sample scope |
|-------|------------|------------------------|
| `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` / static demo fallback | Often unsigned or eval | **Yes** — eval chrome |
| `NEXT_PUBLIC_DEMO_MODE` marketing shells | Mixed | **Yes** when flagged |
| Hosted production seat after post-auth | **Yes** | **No** unless Training or explicit sample visit |

## Inventory table

| Writer / reader | Trigger | Signed-in? | Requires explicit sample visit? | Tests today |
|-----------------|---------|------------|----------------------------------|-------------|
| `writeOperatorScopeToStorage` | Scope switcher, bootstrap apply, sample visit | Yes | No — any write sticks until replaced | `operator-scope-storage.test.ts` |
| `visitSampleWorkspaceScope` | Training chooser, WorkingCareerRehearsalChooser (Practice path), `OpenSampleReviewLink` | Yes | **Yes** (`markSampleWorkspaceVisitActive`) | `operator-scope-actions.test.ts` |
| `buildCustomerIntakeDemoScopeRecord` | Used only via `visitSampleWorkspaceScope` | Yes | **Yes** | `operator-workspace-scope-model.test.ts` |
| `getEffectiveBrowserProxyScopeHeaders` | Every `/api/proxy` call | Yes | Sticky demo **ignored** when signed-in and visit not active (LS-010) | `operator-scope-storage.test.ts` |
| `bootstrapDedicatedWorkspaceScope` | `OperatorWorkspaceScopeBootstrapHost`, chooser live path | Yes | Replaces non-dedicated / demo storage | `operator-scope-bootstrap.test.ts` |
| `applyDedicatedWorkspaceScopeFromAccessToken` | Post-auth Complete (`PostAuthBootstrapClient`) | Yes | Clears sample visit; applies JWT scope | `live-seat-first-login-matrix.test.ts` |
| `resolveDedicatedScopeFromRemoteBootstrap` | Bootstrap when registration/JWT insufficient | Yes | Should return tenant workspace, not demo | Partial via bootstrap tests |
| `tryResolveDedicatedScopeFromRegistration` | Registration payload in localStorage | Yes | Null if payload is sample-shaped | `operator-scope-bootstrap.test.ts` |
| `restoreIdleDeskScopeAfterSignIn` | Post-auth idle desk restore | Yes | Restores **saved** scope — can be demo if user idled on sample | Limited |
| `getScopeHeaders` / `DEV_SCOPE_*` | Unsigned dev defaults | No (unsigned path) | N/A | `scope` tests |
| `DevelopmentDefaultScopeTenantBootstrap` (server) | Dev tenant seeding | N/A (server) | Seeds demo tenant data, not browser storage | Server integration |
| Operator scope cookie (SSR) | Server proxy fallback when headers absent | Yes | Must align with browser fix | `proxy-scope-resolution` tests |
| Playwright `e2e/fixtures/ids.ts` | Uses `DEV_SCOPE_PROJECT_ID` | Test only | Must not leak into product paths | E2E fixtures only |
| `FirstSessionPurposeChooserHost` training path | User chose Training | Yes | **Yes** | `FirstSessionPurposeChooser.test.tsx` |
| `shouldInjectDemoSeededOverviewSample` | Empty Home recent reviews | Yes | Only when scope/label is demo-seeded | `resolve-empty-home-do-this-next.test.ts` |

## Silent writers (pre–LS-010; mitigations)

1. **Persisted Customer Intake Demo in `archlucid_operator_scope_v1`** after a prior unsigned session or old bootstrap — mitigated by sticky-demo ignore + `bootstrapDedicatedWorkspaceScope`.
2. **Missing dedicated candidate** (no JWT scope, no registration payload, remote bootstrap fails) — mitigated by post-auth JWT apply; remaining gap routes to `/auth/bootstrap`, not silent demo (LS-010).
3. **Registration payload falling through to sample** — `tryResolveDedicatedScopeFromRegistration` returns null for sample-shaped IDs.
4. **RSC / cookie default to dev scope** when browser sends demo cookie — browser path now prefers dedicated/JWT for signed-in users.
5. **Post-auth redirect race** — `applyDedicatedWorkspaceScopeFromAccessToken` runs before `window.location.replace`.

## Explicit sample visit gate

- Session flag: `operator-sample-workspace-visit` storage (`isSampleWorkspaceVisitActive`).
- Cleared on: `applyDedicatedWorkspaceScope`, `returnToDedicatedWorkspaceFromSample`, post-auth dedicated apply (unless Training).

## Grep anchors for implementers

- `bootstrapDedicatedWorkspaceScope`
- `visitSampleWorkspaceScope`
- `isSampleWorkspaceScope`
- `DEV_SCOPE_TENANT_ID` / `DEV_SCOPE_WORKSPACE_ID`
