> **Reviewed:** 2026-07-27

> **Scope:** ArchLucid design-partner case study placeholder, plus the first paying tenant (PLG) case-study variant (formerly the body of `TRIAL_FIRST_REFERENCE_CASE_STUDY.md`; that filename remains a path-stable alias).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).


# `<<CUSTOMER_NAME>>` — ArchLucid design-partner case study

> **STATUS: PLACEHOLDER.** Every `<<...>>` token must be replaced with real, customer-approved content **before** moving the corresponding row in [`README.md`](README.md) past `Drafting`. Do not commit a populated version of this file under any tier other than `Drafting` until the customer has signed a reference agreement.

**Audience:** Prospective ArchLucid buyers (architecture practice leads, CIO / CTO sponsors, procurement).

**Tier:** `<<TIER>>` (design-partner price band — see [`PRICING_PHILOSOPHY.md` § 5.2](../PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision) "Design partner discount" row)

**Design-partner term start:** `<<DESIGN_PARTNER_TERM_START>>` (`YYYY-MM-DD`)

**Reference-call cadence:** `<<REFERENCE_CALL_CADENCE>>` (target: quarterly for the first year, semi-annual thereafter)

**Last reviewed:** 2026-07-27

---

## Customer profile

| Attribute | Value |
|-----------|-------|
| Industry | `<<INDUSTRY>>` (e.g., Financial services / Technology / Healthcare — pick the closest [`REFERENCE_NARRATIVE_TEMPLATE.md`](../REFERENCE_NARRATIVE_TEMPLATE.md) archetype) |
| Employees | `<<EMPLOYEE_COUNT>>` |
| Architecture team | `<<ARCH_TEAM_DESCRIPTION>>` (e.g., "8 enterprise architects, central practice") |
| Cloud posture | `<<CLOUD_POSTURE>>` (e.g., "Azure-primary (landing zone v3)") |
| ICP score | `<<ICP_SCORE>> / 45` (compute via [`BUYER_PERSONAS.md`](../BUYER_PERSONAS.md#ideal-customer-profile-icp)) |

---

## Challenge

`<<CHALLENGE_NARRATIVE>>` — Two to three paragraphs, written in the customer's own voice where possible. Map every claim to a buyer pain point in [`BUYER_PERSONAS.md`](../BUYER_PERSONAS.md). Avoid implying capabilities ArchLucid does not have today (see [`docs/V1_SCOPE.md`](../../library/V1_SCOPE.md) for the V1 boundary and [`docs/EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) § 8 for what we explicitly do **not** over-claim).

Suggested skeleton (delete before publishing):

- What architecture review looked like before ArchLucid (cadence, hours per review, evidence quality).
- The specific trigger that made the team evaluate change (audit finding / regulator question / drift incident / new compliance mandate).
- Why they ruled out building it themselves and why competing tools did not fit.

---

## Solution

`<<SOLUTION_NARRATIVE>>` — Frame ArchLucid as **provisioned**, not installed. The default operator path is **Core Pilot** (request → seed → commit → manifest review); only mention Operate (analysis workloads) or Operate (governance and trust) if the customer actually used them.

Concrete details to include:

- Which **layer** they started on (Core Pilot in V1; expanding into Advanced/Enterprise should be called out as a *follow-on* phase, not Day-1).
- Which **finding engines** ran on their first three commits (use the names from `docs/PRODUCT_PACKAGING.md`).
- Which **integrations** they wired up (Microsoft Entra ID SSO, Azure DevOps PR gate, etc.). Use canonical product names — see [`docs/library/CONCEPT_VOCABULARY.md`](../../library/CONCEPT_VOCABULARY.md) § 1.
- How **governance approvals** changed (if Operate (governance and trust) were used). Skip if not applicable.

---

## Results

> **Critical:** every metric in this table must come from the customer's own observable data — **not** an ArchLucid pilot scorecard estimate. Cite the source for each row. If a metric cannot be cited, leave the row out rather than weaken the table.

| Metric | Before | After | Source |
|--------|--------|-------|--------|
| Hours per review | `<<BEFORE_HOURS_PER_REVIEW>>` | `<<AFTER_HOURS_PER_REVIEW>>` | `<<HOURS_SOURCE>>` (e.g., "Customer Jira time-tracking export, 2026-Q3") |
| Reviews per quarter | `<<BEFORE_REVIEWS_PER_QUARTER>>` | `<<AFTER_REVIEWS_PER_QUARTER>>` | `<<REVIEW_COUNT_SOURCE>>` |
| Audit-trail coverage | `<<BEFORE_AUDIT_COVERAGE_PCT>>%` | `<<AFTER_AUDIT_COVERAGE_PCT>>%` | `<<AUDIT_COVERAGE_SOURCE>>` (e.g., "Internal audit Q3 report") |
| Compliance review prep time | `<<BEFORE_COMPLIANCE_PREP>>` | `<<AFTER_COMPLIANCE_PREP>>` | `<<COMPLIANCE_PREP_SOURCE>>` |

Anchor every "After" number against the [`PILOT_SUCCESS_SCORECARD.md`](../PILOT_SUCCESS_SCORECARD.md) definitions so prospects see the same metric framing across every published case study.

---

## Quote

> *"`<<CHAMPION_QUOTE>>`"* — `<<CHAMPION_NAME>>`, `<<CHAMPION_TITLE>>`, `<<CUSTOMER_NAME>>`

**Quote rules:**

- The customer must approve the exact wording in writing (email or contract addendum). Capture the approval reference (`<<QUOTE_APPROVAL_REFERENCE>>`) in the file's review history below.
- No claim about competitive products by name. No claim about specific dollar savings unless the customer has explicitly authorized that number for external use.
- One quote per case study is enough; resist the urge to stack multiple quotes from the same person.

---

## What's next

`<<NEXT_NARRATIVE>>` — Two to four bullets. Examples:

- Expansion to `<<ADDITIONAL_TEAM_OR_BU>>` (`<<ADDITIONAL_SEAT_COUNT>>` more architects).
- Adoption of `<<NEXT_LAYER>>` (Operate (analysis workloads) or Operate (governance and trust)) for `<<NEXT_LAYER_DRIVER>>`.
- Custom finding engines or policy packs for `<<CUSTOM_NEED>>` — link to a Professional-services SOW if one exists.
- Integration with `<<NEXT_INTEGRATION>>` (e.g., GitHub Actions PR gate per [`docs/integrations/CICD_INTEGRATION.md`](../../../docs/integrations/CICD_INTEGRATION.md)).

---

## Reference-availability commitments

| Channel | Commitment | Limit |
|---------|------------|-------|
| Logo on archlucid.net | `<<LOGO_RIGHTS>>` (e.g., "Granted, all marketing pages") | `<<LOGO_LIMIT>>` |
| Reference calls with prospects | `<<REFERENCE_CALL_LIMIT>>` per quarter | At customer's discretion; rescheduled within 30 days if declined |
| Quote in published case study | `<<QUOTE_RIGHTS>>` (e.g., "This document only") | Re-approval required for any new wording |
| Speaking slot at ArchLucid event | `<<SPEAKING_SLOT>>` (e.g., "One per year, optional") | Customer can decline without affecting the rest of the agreement |

---

## Internal review history (do not publish)

| Date | Reviewer | Action |
|------|----------|--------|
| `<<REVIEW_DATE_1>>` | `<<REVIEWER_1>>` | `<<ACTION_1>>` (e.g., "Drafted from real pilot data — 2026-Q2 retro") |
| `<<REVIEW_DATE_2>>` | `<<REVIEWER_2>>` | `<<ACTION_2>>` (e.g., "Customer legal review — minor edits") |
| `<<REVIEW_DATE_3>>` | `<<REVIEWER_3>>` | `<<ACTION_3>>` (e.g., "Approved for external publication") |

Once the row in [`README.md`](README.md) reaches `Published`:

- Strip everything inside `<<...>>` placeholders.
- Strip the **STATUS: PLACEHOLDER** banner at the top.
- Strip this "Internal review history" section.
- Commit the cleanup as its own PR titled `case-study: publish <<CUSTOMER_NAME>>`.

---

## PLG — first paying tenant variant {#plg-first-paying-tenant-variant}

Former standalone body: `docs/go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md` → this section (filename kept as a path-stable alias).

Use this variant when the first publishable reference is a **self-serve trial → paid** conversion, not a named design partner. Copy this section into `<CUSTOMER_SLUG>_CASE_STUDY.md` (or keep the alias file populated) and follow the same publication gates as the design-partner scaffold above.

### Owner substitution checklist — fill before customer review

| Placeholder | Real value needed | Typical source |
|-------------|-------------------|----------------|
| `<<CUSTOMER_NAME>>` | Legal customer name for external publication | Order form / MSA / billing entity |
| `<<TIER>>` | Commercial tier at conversion | Subscription record + [`PRICING_PHILOSOPHY.md` § 5.2](../PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision) |
| `<<TRIAL_START_DATE>>`, `<<CONVERSION_DATE>>`, `<<LAST_REVIEW_DATE>>` | UTC dates | CRM + Stripe/Marketplace subscription events |
| `<<INDUSTRY>>`, `<<TEAM_SIZE>>`, `<<CLOUD_POSTURE>>`, `<<ACQUISITION_CHANNEL>>` | Firmographics | Champion interview |
| `<<CHALLENGE_NARRATIVE>>`, `<<SOLUTION_NARRATIVE>>` | Approved prose | Internal interview notes (NDA) |
| `<<MINUTES_OR_HOURS>>`, `<<INTEGRATIONS>>` | Time-to-first-commit + wired connectors | Audit export + integration catalog |
| `<<BEFORE_TTFV>>`, `<<AFTER_TTFV>>`, `<<TTFV_SOURCE>>` | TTFV table | `pilot-run-deltas.json` + sponsor sign-off |
| `<<BEFORE_HOURS>>`, `<<AFTER_HOURS>>`, `<<HOURS_SOURCE>>` | Review-cycle hours | Tenant baseline (`GET /v1/tenant/trial-status`) + measured deltas |
| `<<CHAMPION_QUOTE>>`, `<<CHAMPION_NAME>>`, `<<CHAMPION_TITLE>>` | Quote pack | Written approval (email or Docusign) |
| `<<LOGO_RIGHTS>>`, `<<LOGO_LIMIT>>`, `<<REFERENCE_CALL_LIMIT>>` | Reference program terms | Legal / partnership |
| `<<REVIEW_DATE_1>>`, `<<REVIEWER_1>>`, `<<ACTION_1>>` | Internal review trail | GTM + customer success notes |

**Evidence pack:** use [`README.md#reference-evidence-pack-template`](README.md#reference-evidence-pack-template) (`REFERENCE_PUBLICATION_RUNBOOK.md` alias) with measured lines filled from committed `pilot-run-deltas` JSON — start from the **demo tenant** sample under [`samples/pilot-run-deltas.demo-tenant.json`](samples/pilot-run-deltas.demo-tenant.json) only as a **format scaffold** (every published cell must be replaced with customer-backed values; banner: **demo tenant — replace before publishing**).

### `<<CUSTOMER_NAME>>` — First self-serve paying tenant (PLG reference)

> **STATUS: PLACEHOLDER — PLG path.** This supports the **ship trial first** motion: when the **first** tenant converts from self-serve trial to a **paid** subscription, populate this case study and move the matching row in [`README.md`](README.md) from **Placeholder** toward **Drafting**, then through **Customer review** to **Published** once the customer approves external use. Until then, every `<<...>>` token stays literal in git.

**Audience:** Prospective buyers evaluating product-led proof (time-to-value without a sales-led design partner).

**Tier at conversion:** `<<TIER>>` (see [`PRICING_PHILOSOPHY.md` § 5.2](../PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision))

**Trial started:** `<<TRIAL_START_DATE>>` (`YYYY-MM-DD`)

**Paid conversion date:** `<<CONVERSION_DATE>>` (`YYYY-MM-DD`)

### Why PLG reference matters

This narrative answers: *"Has anyone paid without a bespoke pilot?"* Keep claims bounded to [`docs/V1_SCOPE.md`](../../library/V1_SCOPE.md) and the sponsor guardrails in [`docs/EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) § 8 (do not over-claim transformation or headcount reduction).

### PLG customer profile

| Attribute | Value |
|-----------|-------|
| Industry | `<<INDUSTRY>>` |
| Team size (architecture / platform) | `<<TEAM_SIZE>>` |
| Cloud posture | `<<CLOUD_POSTURE>>` |
| How they found ArchLucid | `<<ACQUISITION_CHANNEL>>` (e.g., search, GitHub, peer referral) |

### PLG challenge

`<<CHALLENGE_NARRATIVE>>` — Why they started a **trial** without a design-partner contract, and what had to be true before they entered a card or signed an order form.

### PLG solution

`<<SOLUTION_NARRATIVE>>` — Core Pilot path only unless they actually used Operate (analysis workloads) or Operate (governance and trust) (call those out as follow-on, not Day-1).

Concrete details:

- Time from signup to **first finalized architecture package** (cite `<<MINUTES_OR_HOURS>>` from audit / metrics).
- Whether they used **Docker pilot** vs **hosted SaaS trial** (pick one primary story).
- Integrations actually wired (`<<INTEGRATIONS>>`).

### PLG results

| Metric | Before (trial baseline) | After (paid) | Source |
|--------|-------------------------|--------------|--------|
| Time to first finalized architecture package | `<<BEFORE_TTFV>>` | `<<AFTER_TTFV>>` | `<<TTFV_SOURCE>>` |
| Hours per architecture review cycle | `<<BEFORE_HOURS>>` | `<<AFTER_HOURS>>` | `<<HOURS_SOURCE>>` |

Anchor metrics to [`PILOT_SUCCESS_SCORECARD.md`](../PILOT_SUCCESS_SCORECARD.md) definitions where possible.

### PLG quote

> *"`<<CHAMPION_QUOTE>>`"* — `<<CHAMPION_NAME>>`, `<<CHAMPION_TITLE>>`, `<<CUSTOMER_NAME>>`

**Quote rules:** same as the design-partner scaffold above — written approval required before **Published**.

### PLG reference-availability commitments

| Channel | Commitment | Limit |
|---------|------------|-------|
| Logo on archlucid.net | `<<LOGO_RIGHTS>>` | `<<LOGO_LIMIT>>` |
| Reference calls | `<<REFERENCE_CALL_LIMIT>>` | At customer's discretion |

### PLG internal review history (do not publish)

| Date | Reviewer | Action |
|------|----------|--------|
| `<<REVIEW_DATE_1>>` | `<<REVIEWER_1>>` | `<<ACTION_1>>` |

When the [`README.md`](README.md) row reaches **Published**, strip placeholders, the PLACEHOLDER banner, and this review table — same discipline as the design-partner template.
