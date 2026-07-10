> **Scope:** Technical backlog items implementing [`MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md`](MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md) (owner-directed 2026-07-10 assessment: keep one app/domain, no new Front Door investment).
> **Status note:** These items are written in the same format as [`TECH_BACKLOG.md`](TECH_BACKLOG.md) and are intended to be merged into it (changelog entry, summary table row, and `## TB-nnn` detail section) as **TB-729 – TB-731**. They were kept in this satellite file instead of being merged directly because `TECH_BACKLOG.md` had ~217 lines of unrelated uncommitted changes in the working tree at the time this was written (a separate, apparently concurrent session's PDF-documentation-strategy cluster, **TB-721 – TB-728**). **Before picking up or merging these items, re-check `TECH_BACKLOG.md` for the current highest `TB-` number** — IDs 729–731 were the next free range as of this writing but were not reserved by an edit to the shared file, so re-verify no collision occurred.

## Summary

| ID | Title | Quality dimension | Priority / window | Size |
|----|-------|--------------------|---------------------|------|
| TB-729 | UI Container App autoscaling headroom (no Front Door change) | Scalability | P1 — V1 | S |
| TB-730 | Harden `OperatorRoleGate` / `OperatorHomeGate` against pre-redirect shell exposure | Trustworthiness | P1 — V1 | M |
| TB-731 | Instrument the marketing/product re-split trigger metric | Observability / Deployability | P2 — V1 | S |

---

## TB-729 — UI Container App autoscaling headroom (no Front Door change) (P1)

**Window:** V1 — solo-founder-safe traffic isolation without a deployment split.

**Why:** `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §4 — a public marketing traffic burst (for example a LinkedIn post or press mention) currently shares the same Container App replica pool as authenticated operator traffic. The topology doc's "Option B" (second Container App + second Front Door origin) would isolate this, but the owner directed avoiding new Front Door investment for this pass. Azure Container Apps already supports HTTP-concurrency-based autoscaling independent of Front Door; the fix is to give the existing single UI Container App more scale-out headroom, not to add a second origin.

**Approach:**

1. In `infra/terraform-container-apps`, locate the UI Container App resource's `template` block (`azurerm_container_app` — standard schema: `min_replicas`, `max_replicas`, and any `http` `scale_rule` with a `concurrent_requests` threshold).
2. Confirm the current `max_replicas` value and HTTP scale-rule concurrency threshold; raise `max_replicas` and/or lower the concurrency threshold so a traffic spike triggers additional replicas before requests queue.
3. Keep `min_replicas` unchanged unless cold-start latency during bursts is also a concern — this item is about ceiling headroom, not baseline cost.
4. Do not add, modify, or reference `marketing_backend_hostname`, a second Container App, or any `infra/terraform-edge` resource as part of this item — that is explicitly deferred (see TB-731).
5. Validate the change with a `terraform plan` against the affected root only; no application code changes are required.

**Acceptance:**

- UI Container App can scale to a higher replica ceiling under sustained concurrent load without any Front Door/DNS/origin changes.
- No new Azure resource type introduced; the app topology (one image, one Container App, one Front Door profile) is unchanged.
- `infra/terraform-container-apps` plan is clean (no unrelated drift) before and after the change.

**Affected files:** `infra/terraform-container-apps/*.tf` (UI Container App `template`/scale-rule block and its `.tfvars` defaults, if the values are variablized).

**Refs:** `docs/library/PUBLIC_MARKETING_SITE_TOPOLOGY.md` (Option B, deferred), `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §4, §6.

**Size estimate:** S.

---

## TB-730 — Harden `OperatorRoleGate` / `OperatorHomeGate` against pre-redirect shell exposure (P1)

**Window:** V1 — closes the actual "buyer sees admin UI" risk identified during the marketing/product separation assessment.

**Why:** `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §3 — `OperatorRoleGate` (`archlucid-ui/src/components/OperatorRoleGate.tsx`) and `OperatorHomeGate` (`archlucid-ui/src/components/OperatorHomeGate.tsx`) are client components that redirect **after** hydration and authority resolution (`useOperatorNavAuthority()`), not before render. An anonymous or unauthorized visitor who deep-links into an operator route can see `AppShellClient` shell chrome (sidebar, topbar) render for a frame before the `router.replace("/403")` (or marketing redirect) takes effect. This is the real mechanism behind the "public buyers do not see product-admin UI artifacts" acceptance criterion — a marketing/product deployment split would not fix it, since the leak is internal to the operator app's own render path.

**Approach:**

1. In `OperatorRoleGate.tsx`, change the render branch so that while `isAuthorityLoading` is true, or before the first authority resolution completes, the component renders a neutral loading state (blank/skeleton with no sidebar/topbar content) instead of falling through to `<>{children}</>` — currently the final `return <>{children}</>;` fires whenever the redirect condition is false, which includes the loading window.
2. Apply the same principle to `OperatorHomeGate.tsx` for the `/` route.
3. Confirm `AppShellClient` does not render `SidebarNav`/`OperatorShellTopBar` content until the gate has resolved — the neutral loading state should replace the whole shell frame, not just the page body, so no nav labels/branding specific to the product are visible pre-resolution.
4. Add/extend tests (`OperatorRoleGate.test.tsx` already exists) asserting that no sidebar/topbar text or nav items are present in the DOM during the loading window for an anonymous session, only after resolution.
5. This is a UI-only change; no backend/API contract changes.

**Acceptance:**

- An anonymous visitor deep-linking to any `(operator)` route sees a neutral loading state, never sidebar/nav/product-shell content, until authority resolves and either renders the page or redirects.
- Existing authorized-user flows render with no added perceptible delay beyond the existing authority-resolution round trip.
- `OperatorRoleGate.test.tsx` (and an equivalent for `OperatorHomeGate` if not already covered) assert the no-premature-shell-content behavior.

**Affected files:** `archlucid-ui/src/components/OperatorRoleGate.tsx`, `archlucid-ui/src/components/OperatorHomeGate.tsx`, `archlucid-ui/src/components/AppShellClient.tsx`, `archlucid-ui/src/components/OperatorRoleGate.test.tsx`.

**Refs:** `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §3, §6, §8.

**Size estimate:** M.

---

## TB-731 — Instrument the marketing/product re-split trigger metric (P2)

**Window:** V1 — makes the future "revisit Option B / real domain split" decision data-driven instead of calendar-driven.

**Why:** `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §6 recommends deferring any deployment/domain split until a concrete trigger fires, but no such trigger is currently measured. Without instrumentation, the decision to eventually split (which does require Front Door investment) has no signal to act on.

**Approach:**

1. Identify the cheapest existing signal that already indicates traffic pressure on the shared UI Container App — Container App CPU/replica-count metrics (already emitted to whichever monitoring stack `infra/terraform-monitoring` wires up) are the primary candidate; do not introduce a new telemetry vendor.
2. Add a threshold-based alert (or dashboard panel, if alerting infrastructure is not yet in place) for sustained high replica count / CPU saturation on the UI Container App during a traffic burst.
3. Separately, add a simple counter/dimension on self-serve signup volume (reusing the existing `recordFirstTenantFunnelEvent` / first-tenant funnel diagnostics already emitted from `SignupForm.tsx`) so growth in that funnel is visible without a new analytics system.
4. Document both trigger conditions (traffic-pressure threshold and signup-volume threshold) directly in `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §6 once the concrete threshold values are chosen, so the next assessment pass has an explicit go/no-go signal instead of re-deriving one.
5. This item does not implement Option B or any Front Door change — it only instruments the signal that would justify picking that item up later.

**Acceptance:**

- A Container App CPU/replica-saturation signal is visible in the existing monitoring stack with a defined threshold.
- Self-serve signup volume is visible via existing first-tenant funnel diagnostics, with no new third-party analytics tool introduced.
- `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §6 is updated with the chosen concrete threshold values once set.

**Affected files:** `infra/terraform-monitoring/*.tf` (alert rule), `docs/library/MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` (§6 threshold values), no `archlucid-ui` application code changes expected beyond confirming existing funnel event emission is sufficient.

**Refs:** `MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md` §4, §6; `docs/library/PUBLIC_MARKETING_SITE_TOPOLOGY.md` (Option B, the deferred lever this trigger would justify revisiting).

**Size estimate:** S.
