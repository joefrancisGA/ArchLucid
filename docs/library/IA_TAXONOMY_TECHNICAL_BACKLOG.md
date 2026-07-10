> **Scope:** Technical backlog items implementing the help/documentation/marketing/trust
> information-architecture refactor planned in
> [`.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`](../../.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md).
> **Status note:** These items are written in the same format as [`TECH_BACKLOG.md`](TECH_BACKLOG.md)
> and are intended to be merged into it (changelog entry, summary table rows, and `## TB-nnn`
> detail sections) as **TB-732 – TB-737**. They were kept in this satellite file instead of being
> merged directly because, at the time this was written, `TECH_BACKLOG.md` had ~217 lines of
> unrelated uncommitted changes in the working tree (a separate, apparently concurrent session's
> PDF-documentation-strategy cluster, **TB-721 – TB-728**), and IDs **TB-729 – TB-731** — this
> file's original choice — were claimed in the same window by a different concurrent session's
> commit (`dde70b9ff6`, "Add marketing/product separation assessment and backlog (TB-729-731)"),
> which used the same satellite-file pattern for the same reason. **Before picking up or merging
> these items, re-check both `TECH_BACKLOG.md` and any other satellite backlog files for the
> current highest `TB-` number** — IDs 732–737 were the next free range as of this writing but
> were not reserved by an edit to the shared file, so re-verify no collision occurred.
>
> **Execution status: none of these items have been implemented.** Each has a paired Composer
> prompt file under `.cursor/prompts/` with full context, approach, tests, and acceptance criteria
> — hand the matching prompt file to Composer when picking an item up.

## Summary

| ID | Title | Quality dimension | Priority / window | Size | Cursor prompt |
|----|-------|--------------------|---------------------|------|---------------|
| TB-732 | IA taxonomy foundation doc + registry `contentKind` metadata | Maintainability | P1 — V1 | S | `ia-taxonomy-01-foundation-doc-and-registry-metadata.md` |
| TB-733 | Context-sensitive help extraction | Adoption friction | P2 — V1 | M | `ia-taxonomy-02-context-sensitive-help-extraction.md` |
| TB-734 | `/help` Guides-vs-Documentation split | Adoption friction | P2 — V1 | M | `ia-taxonomy-03-product-help-vs-technical-docs-split.md` |
| TB-735 | Internal-runbook gating hardening (highest priority — security-adjacent) | Trustworthiness | P1 — V1 | M | `ia-taxonomy-04-internal-runbook-gating-hardening.md` |
| TB-736 | Marketing surface hygiene and first-run entry-point consolidation | Adoption friction | P2 — V1 | M | `ia-taxonomy-05-marketing-surface-hygiene.md` |
| TB-737 | Security & trust materials consolidation | Trustworthiness | P2 — V1 | M | `ia-taxonomy-06-security-trust-consolidation.md` |

All six depend on **TB-732** landing first. **TB-734** and **TB-735** both edit
`help-center-catalog.ts` and must not run concurrently against the same working tree.

---

## TB-732 — IA taxonomy foundation doc + registry `contentKind` metadata (P1)

**Window:** V1.

**Why:** ArchLucid mixes context-sensitive help, product help, technical documentation, marketing
content, and security/trust material behind one `(operator)` shell and one `/help` renderer.
Before any of **TB-733**–**TB-737** move or gate content, one canonical taxonomy document and one
metadata field must exist so those items share a source of truth instead of each re-deriving the
categorization independently.

**Approach:**

1. Add `docs/architecture/INFORMATION_ARCHITECTURE.md` recording the five-category taxonomy
   (context-sensitive help / product help / technical documentation / marketing / security & trust)
   and why route groups `(marketing)`/`(operator)`/`(executive)` map to public vs app-only
   authenticated; cross-link `docs/library/DOCUMENTATION_BY_AUDIENCE.md` (that doc routes **repo**
   markdown by reader; this doc routes **in-app and public product surfaces** by content kind).
2. Add `contentKind: 'product-help' | 'technical-documentation' | 'internal-runbook'` to every
   entry in `product-documentation-registry.ts`, additive only — no rendering change in this item.
3. Extend `product-documentation-registry.test.ts` to assert every topic has a `contentKind` and
   that `first-pilot-operator-runbook`/`first-value-20-minutes`/`pre-commit-ci-gate` are tagged
   `internal-runbook`.

**Acceptance:**

- `docs/architecture/INFORMATION_ARCHITECTURE.md` exists and is cross-linked from
  `DOCUMENTATION_BY_AUDIENCE.md`.
- Every registry entry has a `contentKind`; no `/help` route, nav item, or rendered page changes.

**Affected files:** `docs/architecture/INFORMATION_ARCHITECTURE.md` (new),
`archlucid-ui/src/lib/product-documentation-registry.ts`,
`archlucid-ui/src/lib/product-documentation-registry.test.ts`.

**Refs:** Cursor prompt `.cursor/prompts/ia-taxonomy-01-foundation-doc-and-registry-metadata.md`
(execution detail); plan `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`; prerequisite for
**TB-733**–**TB-737**.

**Size estimate:** S.

---

## TB-733 — Context-sensitive help extraction (P2)

**Window:** V1.

**Why:** `page-help-topic-map.ts` today maps a page straight to a full `/help/{slug}` article as
its "contextual help," conflating a short in-line answer with long-form documentation. The
taxonomy calls for a page-scoped answer to exactly four questions (what is this page / what should
I do next / why is this state empty / where do I configure the prerequisite), not a jump to a
long article.

**Approach:**

1. Add `archlucid-ui/src/lib/contextual-help-registry.ts`, keyed the same way as
   `page-help-topic-map.ts`, with up to four short fields per page (≤ ~120 words total); reuse
   `ContextualHelp.tsx` / `FieldHelpTooltip.tsx` / `ui/tooltip.tsx` shapes rather than inventing new
   popover chrome.
2. Add a content-constraint test: no field may contain an internal route prefix, raw API path, or
   `TB-` roadmap label.
3. Wire `PageContextualHelpButton.tsx` to prefer the new registry when an entry exists, falling
   back to today's `/help` deep link otherwise, so migration can land incrementally.
4. Write the four-question copy for the starting page set: `/reviews` (empty state),
   `/governance/findings`, `/digests`, `/planning`, `/advisory`, `/value-report`.

**Acceptance:**

- The six starting pages show in-line short answers instead of a raw jump to a full article.
- No contextual-help field exceeds the length/content constraints; pages not yet migrated are
  unaffected (fallback path).

**Affected files:** `archlucid-ui/src/lib/contextual-help-registry.ts` (new),
`archlucid-ui/src/lib/usability/page-help-topic-map.ts`,
`archlucid-ui/src/components/usability/PageContextualHelpButton.tsx`,
`archlucid-ui/src/lib/contextual-help-content.ts`.

**Refs:** Cursor prompt `.cursor/prompts/ia-taxonomy-02-context-sensitive-help-extraction.md`;
depends on **TB-732**.

**Size estimate:** M.

---

## TB-734 — `/help` Guides-vs-Documentation split (P2)

**Window:** V1.

**Why:** `/help` renders product-help guides and developer/admin technical reference through the
same tabs with no visible distinction, so users cannot tell "Help" from "Documentation." The
acceptance bar is that they can, at a glance.

**Approach:**

1. Restructure `HelpTabsShell.tsx` into explicit "Guides" and "Documentation" sections filtered by
   the `contentKind` field added in **TB-732**, not by the existing `tier`.
2. Reclassify `configuration-reference`, `operator-auth-roles`, `cli-usage`,
   `governance-api-contracts`, `admin-diagnostics`, `developer-troubleshooting` from "Guide" styling
   to "Documentation" styling; keep `getting-started`, `review-guide`, `first-pilot-path`,
   `pilot-guide`, `cloud-connections*`, `enterprise-onboarding`, `procurement`, `how-it-works` as
   "Guides."
3. **Do not build a second PDF export mechanism.** The existing **TB-721–TB-728** cluster
   (`PDF_DOCUMENTATION_STRATEGY.md`) already ships browser-print (Phase 0, **TB-721**) and
   build-time static PDF generation (Phase 1, **TB-723**) reusing `MarkdownPdfRenderer.cs`
   (QuestPDF) and a registry `pdfStatus` field (**TB-722**). Give Documentation-tab entries the
   same "Download PDF" affordance those items already define — do not reinvent it here.
4. Repoint `/settings/identity/sso-wizard`, `/settings/api-keys`, `/settings/cloud-connections/*`
   help links to the matching Documentation entry instead of duplicating technical prose inline.

**Acceptance:**

- `/help` visually separates Guides from Documentation; search drawer results carry the same label.
- Documentation entries reuse the **TB-721**/**TB-723** PDF affordance rather than a new one.
- No regression to any existing `/help/{slug}` URL.

**Affected files:** `archlucid-ui/src/lib/help-center-catalog.ts`, `help-topics.ts`,
`archlucid-ui/src/app/(operator)/help/page.tsx`, `HelpTabsShell.tsx`, `HelpSearchPanel.tsx`.

**Refs:** Cursor prompt `.cursor/prompts/ia-taxonomy-03-product-help-vs-technical-docs-split.md`;
depends on **TB-732**; coordinate with **TB-721–TB-728**; do not run concurrently with **TB-735**
(both touch `help-center-catalog.ts`).

**Size estimate:** M.

---

## TB-735 — Internal-runbook gating hardening (P1, highest priority — security-adjacent)

**Window:** V1.

**Why:** `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, `FIRST_VALUE_20_MINUTES.md`, and
`PRE_COMMIT_CI_GATE_STARTER.md` are vendor-internal runbooks reachable at `/help/{slug}` today,
apparently gated only by the client-side `isAdmin` prop passed into
`listHelpCenterTopics({ showAdvanced, isAdmin })` in `help-center-catalog.ts` — nav-visibility, not
a proven server/loader-level access check. Unlike the rest of this cluster, this is a potential
content-exposure gap, not only an IA/UX improvement.

**Approach:**

1. Trace the full call path from `/help/[...topic]/page.tsx` through any role check to
   `load-product-documentation.ts` for one flagged slug, and record in the PR exactly where (if
   anywhere) role is checked today.
2. If the loader is unconditional, add a role/authority check reusing the existing
   `OperatorRoleGate`/`AdminAuthority` pattern already used by `/admin/*` (`admin/layout.tsx`), so
   `contentKind: 'internal-runbook'` slugs (from **TB-732**) 403/404 for non-admin sessions
   independent of nav visibility.
3. Decide per slug, with recorded reasoning, whether it stays in the in-app registry
   (admin-gated) or is removed from the in-app registry entirely and stays repo-only documentation.

**Acceptance:**

- Internal-tier runbook content cannot be fetched by a non-admin session via a loader/route-level
  check, not only nav/search hiding; admin access is regression-tested as still working.
- PR states plainly, with evidence, whether this was a real gap or defense-in-depth hardening.

**Affected files:** `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx`,
`archlucid-ui/src/lib/load-product-documentation.ts`, `archlucid-ui/src/lib/help-center-catalog.ts`.

**Refs:** Cursor prompt `.cursor/prompts/ia-taxonomy-04-internal-runbook-gating-hardening.md`;
depends on **TB-732**; do not run concurrently with **TB-734**; flag for review rather than folding
silently into a larger IA PR.

**Size estimate:** M.

---

## TB-736 — Marketing surface hygiene and first-run entry-point consolidation (P2)

**Window:** V1.

**Why:** Four surfaces answer "how do I start" today (`/get-started`, `/quick-start`, `/onboarding`,
`/help/getting-started`), and public marketing pages have not been swept for internal route
leakage, `TB-` labels, or non-buyer "Operator" persona voice (`DOCUMENTATION_BY_AUDIENCE.md` already
flags the voice issue for repo docs; this extends the check to marketing UI copy).

**Approach:**

1. Designate `/get-started` the single marketing CTA; retire `/quick-start` via 301 to
   `/get-started` unless product/marketing wants an explicit, documented A/B exception. Point
   `/get-started`'s CTA at `/onboarding` (the in-app flow), with `/help/getting-started` becoming
   the "learn more" link, not the primary path.
2. Grep `archlucid-ui/src/app/(marketing)/` and marketing components for internal route prefixes,
   `TB-` labels, and "Operator" voice; fix hits; add a regression test that no marketing page links
   to `/why-archlucid` or `/demo/explain`.
3. Compare `marketing-faq.ts` against `docs/go-to-market/PROCUREMENT_FAQ.md` (`/help/procurement`)
   for verbatim duplication; shorten the marketing copy to a summary + link where duplicated.
4. Produce a keep/merge/retire recommendation for `/why`, `/see-it`, `/try`, `/quick-scan` overlap;
   only act on unambiguous cases, flag the rest for owner sign-off.

**Acceptance:**

- One documented "how do I start" CTA (or two, with an explicit reason for both).
- Test-enforced: no marketing page links to `/why-archlucid` or `/demo/explain`; no internal route
  prefix, `TB-` label, or "Operator" voice in marketing copy.

**Affected files:** `archlucid-ui/src/app/(marketing)/**`, `archlucid-ui/src/lib/marketing-faq.ts`,
`archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`, `archlucid-ui/src/app/sitemap.ts`.

**Refs:** Cursor prompt `.cursor/prompts/ia-taxonomy-05-marketing-surface-hygiene.md`; depends on
**TB-732**.

**Size estimate:** M.

---

## TB-737 — Security & trust materials consolidation (P2)

**Window:** V1.

**Why:** `/trust` and `/security-trust` are two public pages with an unclear distinction, and the
trust-center narrative exists as four separate markdown copies
(`docs/trust-center.md`, `docs/go-to-market/trust-center.md`, `docs/go-to-market/TRUST_CENTER.md`,
`docs/security/trust-center.md`) that can silently drift apart.

**Approach:**

1. Diff all four trust-center files; confirm which one `readTrustCenterMarkdown` actually reads for
   `/trust`; turn the other three into one-line pointers or remove them if unreferenced.
2. Produce a recommendation on `/trust` vs `/security-trust` (merge with redirect, or explicit
   differentiation — default to explicit differentiation unless the diff shows near-total overlap).
3. Ensure the CAIQ/SOC2-self-assessment/pen-test-summary assurance packet is linked from a public
   page and downloadable without authentication, reusing the **TB-721**/**TB-723** PDF affordance
   (do not build a second export mechanism — same constraint as **TB-734**).
4. Cross-link `TENANT_ISOLATION.md`, `subprocessors`, `how-it-works`, `AUDIT_COVERAGE_MATRIX.md`
   via existing `/help/{slug}` entries rather than duplicating content on the trust page.

**Guardrail:** per `.cursor/rules/V1_1-assurance-backlog.mdc`, this item must not commission,
imply as in-progress, or schedule CPA-attested SOC 2 or third-party pen-testing — those remain
V1.1-backlog (**TB-135**/**TB-136**), owner-directed only. This item only reorganizes existing
self-assessment/owner-conducted-pen-test material.

**Acceptance:**

- One canonical trust-center markdown source; `/trust` vs `/security-trust` distinction is
  documented and non-arbitrary; assurance packet downloadable unauthenticated.
- No new implication of CPA SOC 2 attestation or third-party pen-testing.

**Affected files:** `docs/trust-center.md`, `docs/go-to-market/trust-center.md`,
`docs/go-to-market/TRUST_CENTER.md`, `docs/security/trust-center.md`,
`archlucid-ui/src/app/(marketing)/trust/page.tsx`, `security-trust/page.tsx`.

**Refs:** Cursor prompt `.cursor/prompts/ia-taxonomy-06-security-trust-consolidation.md`; depends
on **TB-732**; coordinate with **TB-721–TB-728**; guardrail `.cursor/rules/V1_1-assurance-backlog.mdc`.

**Size estimate:** M.
