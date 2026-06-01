> **Scope:** Product and operations decisions the repo cannot resolve alone — consolidated pending list (supersedes scattered assessment §9 lists).
>
> **Status:** current

# Pending questions (product and operations)

## Resolution preamble (moved out of `Scope` header 2026-05-18)

*The bullets below were formerly in the opening blockquote; substance is unchanged — only relocated so the **`Scope`** line stays one sentence per CI.*

- **2026-05-18 — First-party core connectors (Jira / ServiceNow / Confluence / Slack) + Teams / webhooks / recipes buyer contract:** **V1.1** release-window per [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3 — **not** V1 GA gatekeepers. **V1** integration posture: **REST**, **CLI**, **operator UI**, **SCIM**, **Azure DevOps** / **GitHub** CI surfaces, **Azure extractor ZIP** (**§2.16**). **Microsoft Teams**, **CloudEvents webhooks**, and **customer-operated** recipes are **V1.1** **buyer-contract** paths, not V1 GA commitments. Supersedes *Resolved 2026-05-06* and *Resolved 2026-05-05 (Connectors V1 GA)* for **calendar / headline readiness** only. *Resolved 2026-05-18 (First-party connectors — V1.1 window)* below.
- **2026-05-06 — ITSM bidirectional sync:** **both** Jira and **ServiceNow** bidirectional status sync **substance** retained — **delivery window** moved to **V1.1** per *Resolved 2026-05-18* (historically logged as V1 GA in *Resolved 2026-05-06* below).
- **2026-05-05 (k) — Live commerce cutover** (**item 22**): **Stripe production first**, then **Marketplace go-live**. **Rollback owner:** **Joseph Francis**. Dates + comms remain open until un-held. *Resolved 2026-05-05 (commerce cutover sequencing — item 22 partial)* below.
- **2026-05-05 (j) — Next workflow-breadth bet:** **deeper Microsoft-native** (Teams / Logic Apps / [ADR 0019](architecture/adrs/0019-logic-apps-standard-edge-orchestration.md)); **not** “ITSM polish first.” *Resolved 2026-05-05 (next workflow breadth — item 4)* below. **Updated 2026-05-18:** first-party **ServiceNow**, **Jira**, **Confluence**, **Slack**, **Microsoft Teams** webhook delivery, **CloudEvents** outbound webhooks, and **recipe** bridges are **V1.1** buyer-contract surfaces (see [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3); **V1** emphasizes **REST** + **CLI** + **operator UI** + **§2.16+** anchors.
- **2026-05-05 (i) — VPAT vs WCAG:** stay on WCAG self-attestation (`ACCESSIBILITY.md` + marketing `/accessibility`); **no** formal VPAT on Trust Center for now. *Resolved 2026-05-05 (VPAT posture)* below.
- **2026-05-05 (h) — Public marketing pricing:** locked list prices for **all paid tiers except Enterprise**; Enterprise **quote / contact sales**. *Resolved 2026-05-05 (public pricing surface)* below.
- **2026-05-05 (g) — Reference-customer `Published`:** **owner solo** watches trial-to-paid, validates case study, flips [`reference-customers/README.md`](go-to-market/reference-customers/README.md) row. *Resolved 2026-05-05 (reference publication owner)* below.
- **2026-05-05 (f) — SOC 2 Type I trigger:** **$250K ARR** or **first binding procurement requirement**, whichever is earlier. *Resolved 2026-05-05 (SOC 2 ARR trigger)* below.
- **2026-05-05 (e) — Paid-proposal readiness:** preferred signal: committed **Golden Manifest** on **real customer architecture context**; **not** a hard gate. *Resolved 2026-05-05 (paid proposal bar)* below.
- **2026-05-05 (d) — Quote-request follow-up:** **owner solo** until team scale; **HubSpot** (or similar) product integration → **V2**. *Resolved 2026-05-05 (quote CRM routing)* below.
- **2026-05-05 (c) — H1 GTM:** design-partner–led primary; **in parallel** independent paid or trial users. *Resolved 2026-05-05 (H1 GTM motion)* below.
- **2026-05-05 (b) — SIEM + sandbox:** custom SIEM outbound mapping → **JQ**; guided sandbox → **client-side UI mock only**. **SaaS posture:** **no** tenant-facing Docker Compose — compose **developers-maintaining-this-repo only**. *Resolved 2026-05-05 (SIEM + guided sandbox)* below.
- **2026-05-05 — Connectors V1 GA:** **Jira**, **ServiceNow**, **Slack**, **Confluence** first-party connectors / chat-ops / doc publish in **V1 GA** — [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13–§2.15; *Resolved 2026-05-05* and *Confluence promoted 2026-05-05* below. **Superseded for headline V1 GA window (2026-05-18):** same connectors → **V1.1** per *Resolved 2026-05-18*.
- **2026-05-03 (commercial entity):** phased playbook **Francis Architecture, LLC** — [`runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md). Until **`CHANGELOG.md`** records completion, sole-prop / Stripe owner resolutions below stay in force.
- **2026-05-03 — Design partner:** signed commercial engagement → **V1.1** motion, **not** V1 GA gate; **`(A)` assessments must not** penalize absence — [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6b.
- **2026-05-30 — Real pilot proof cohort data policy:** customer data, sanitized internal data, and demo-only data are all allowed input classes for the V1.1 real pilot proof packet cohort, subject to tenant/customer authorization, redaction, source labeling, and buyer-safe caveats. See *Resolved 2026-05-30 (real pilot proof cohort data policy)* below.
- **2026-05-30 — First proof-density cohort scenarios:** first cohort scenarios are AI / LLM workload governance, regulated SaaS procurement / SOC-style diligence, and Azure cost / orphan / governance review. See *Resolved 2026-05-30 (first proof-density cohort scenarios)* below.
- **2026-05-30 — Market-facing demo asset evidence policy:** real-mode output may be shown in public assets when authorized, redacted, source-labeled, and caveated; synthetic/demo-labeled assets remain allowed. See *Resolved 2026-05-30 (market-facing demo asset evidence policy)* below.
- **2026-05-30 — First market-facing demo asset channel:** optimize Upwork first for V1.1 market-facing demo asset production; website, sales email, LinkedIn, and live demo can reuse the asset system later. See *Resolved 2026-05-30 (first demo asset channel)* below.
- **2026-05-30 — Third-party pen-test customer wording:** customer-facing materials should say **"planned, not yet scheduled"** for the third-party pen-test program, not "V1.1 backlog" or release-specific phrasing. Internal backlog tracking remains TB-136. See *Resolved 2026-05-30 (third-party pen-test customer wording)* below.
- **2026-05-30 — SOC 2 readiness timing wording:** Trust Center and buyer-facing readiness wording should continue to cite the ARR/procurement trigger for SOC 2 Type I engagement. See *Resolved 2026-05-30 (SOC 2 readiness timing wording)* below.
- **2026-05-30 — Azure example region and naming:** examples should assume Azure **East US** (`eastus`) and Microsoft-standard Azure naming conventions. See *Resolved 2026-05-30 (Azure example region and naming)* below.
- **2026-05-30 — Hosted production Terraform root:** `infra/terraform/prod` is the authoritative hosted production footprint root. See *Resolved 2026-05-30 (hosted production Terraform root)* below.
- **2026-05-30 — Azure OpenAI / Azure AI Search Terraform composition:** hosted SaaS examples should compose Azure OpenAI and Azure AI Search into the hosted stack by default; separate roots remain validation/module staging surfaces or special-deployment escape hatches. See *Resolved 2026-05-30 (Azure OpenAI and Search Terraform composition)* below.
- **2026-05-30 — Broader-claims threshold source:** the minimum threshold for moving from controlled pilots to broader claims is already defined by [`GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md) § *Proof-gated rollout criteria*. See *Resolved 2026-05-30 (broader-claims threshold source)* below.
- **2026-05-30 — `signup.archlucid.net` DNS cutover readiness:** the **`signup.archlucid.net`** hostname is **owned** and **ready for DNS cutover** to the production Front Door custom domain when commerce un-hold executes. This does **not** authorize cutover before the owner flips live Stripe/Marketplace settings. See *Resolved 2026-05-30 (signup.archlucid.net DNS cutover readiness)* below.
- **2026-05-30 — Team self-serve Stripe SKU at launch:** keep the **interim bundled Team Checkout SKU** (**$249**/month USD, single `PriceIdTeam`) at commerce un-hold launch — do **not** split into per-component Stripe line items first. See *Resolved 2026-05-30 (Team self-serve Stripe SKU at launch)* below.
- **2026-05-30 — Enterprise UI design system rollout sequencing:** phased rollout — **not** a single all-components pass. Shared primitives first, then **first-pilot path + run detail**, then **Home/dashboard**, then **governance/audit**, then cross-cutting spacing/typography polish. See *Resolved 2026-05-30 (Enterprise UI design system rollout sequencing)* below.
- **2026-05-30 — Azure AI Search index field names:** repo contract in [`AZURE_AI_SEARCH_INDEX_CONTRACT.md`](library/AZURE_AI_SEARCH_INDEX_CONTRACT.md) is authoritative over out-of-repo index schemas — camelCase `tenantId`, `workspaceId`, `projectId`, `corpusKind`, `documentId`, `chunkId` (key), vector field **`embedding`**, lexical **`text`**. See *Resolved 2026-05-30 (Azure AI Search index field contract)* below.
- **2026-05-29 — Assessment #23 / #25 → V1.1 backlog:** SOC 2 CPA (**TB-135**) and third-party pen test (**TB-136**) are **V1.1 backlog** organizational programs — **not** V1 assessment implementation prompts. See **`.cursor/rules/V1_1-assurance-backlog.mdc`**, [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c. *Resolved 2026-05-29 (assurance V1.1 backlog)* below.
- **2026-05-29 — Azure AI Search on production-like profiles:** **Required for all production-like profiles** (not optional when reranking alone). See *Resolved 2026-05-29 (Azure AI Search — production-like requirement)* below.
- **2026-05-29 — Scope-to-identity / API key pilots:** **No** existing pilots rely on header-only tenant selection with API keys; TB-072 may enforce binding without a pilot carve-out. See *Resolved 2026-05-29 (API key scope binding — no legacy pilots)* below.
- **2026-05-01 — Third-party pen test:** **V1.1 backlog (TB-136)**; **V1** = owner-conducted (**TB-005**); supersedes prior **V2** framing where it conflicted — see [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c.
- **2026-04-27:** (1) Auth default: Entra ID or explicit API keys (Resolved). (2) Hidden UI features: **404** (Resolved).

**Last updated:** 2026-05-30 — **Azure AI Search index field contract** (*Resolved 2026-05-30*) · **Enterprise UI design system rollout sequencing** (*Resolved 2026-05-30*) · **Team self-serve bundled Stripe SKU at launch** (*Resolved 2026-05-30*) · **`signup.archlucid.net` DNS readiness** (*Resolved 2026-05-30*). Prior **2026-05-18 — Connectors + integration contract:** first-party **Jira** / **ServiceNow** / **Confluence** / **Slack** and **Teams** / **webhooks** / **recipes** as **buyer-contract** paths → **V1.1** (*Resolved 2026-05-18* + scope clarification same day). **V1** buyer bar: **REST** / **CLI** / **operator UI** / **§2.16+**. Prior **2026-05-05** commerce / breadth / WCAG / pricing block unchanged except connector window.

**Earlier owner batches (2026-04-21 → 2026-04-24):** 2026-04-24 (independent §8 ten-improvement owner Q&A — 14 decisions), sixth pass (17 decisions), assessment §4 (11), commerce + connector + SaaS scope tables, 2026-04-22 assessment + ADR 0030 sub-tables, 2026-04-21 (19 + follow-up 5 + Teams/RLS bundle + Phase 3 re-scope). Older verbatim tables moved to **[`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md)** so this spine file stays within CI line budget; summaries and **Still open** items remain here.

Single place to track **decisions only a human owner** can make. When you ask what is still open, start here. Items marked **Resolved** stay for audit trail; remove them only when you intentionally shrink the file.

---

## Resolved 2026-05-18 (First-party connectors — V1.1 window)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Release window** | First-party **Jira**, **ServiceNow**, **Confluence**, **Slack** ([`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13–§2.15), **Microsoft Teams** / **CloudEvents webhooks** / **Service Bus** integration events (**§2.8**), and **customer-operated** recipe bridges (**§3**) are **V1.1** product obligations — **not** V1 GA gatekeepers. | [`V1_SCOPE.md`](library/V1_SCOPE.md), [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6–§6a, [`INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), readiness assessments |
| **V1 integration posture** | **REST**, **CLI**, **operator UI**, **SCIM**, **Azure DevOps** / **GitHub** CI surfaces, **Azure extractor ZIP** (**§2.16**), and other **§2** Pilot/Operate HTTP paths are the **V1 GA** contract. **Microsoft Teams**, **CloudEvents webhooks**, and **customer-operated** recipes under [`docs/integrations/recipes/`](integrations/recipes/README.md) are **V1.1** buyer-contract surfaces (**§2.8**, **§2.14**, **§3**) — not V1 GA commitments. | Recipes hub, buyer-facing catalog, assessments |
| **Supersedes (headline / calendar only)** | *Resolved 2026-05-05* “**Connectors V1 GA**” and *Resolved 2026-05-06* “**ITSM** … **V1 GA**” for **readiness scoring** and **release pinning**; technical substance (bidirectional sync, sequencing, mappings) remains in §2.13–§2.15. | Historical rows in this file |

---

## Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)

> **Note (2026-05-18):** Substance below is **unchanged**; **delivery window** is **V1.1** per *Resolved 2026-05-18 (First-party connectors — V1.1 window)*. Where rows say **V1 GA** / **V1**, read **V1.1** for the connector program gate.

| Sub-decision | Decision | Affects |
|---|---|---|
| **ServiceNow → ArchLucid finding state sync** | **In scope for V1.1** (substance; historically logged as V1 GA). Two-way status sync (ServiceNow incident status → ArchLucid finding state) is **committed**. Supersedes the prior "not committed unless explicit owner decision adds it" clause in [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13. | [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13, [`INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), ServiceNow connector implementation |
| **Jira → ArchLucid finding state sync** | **Committed** for the **V1.1** connector window (historically: V1 GA). Bidirectional sync is a **firm** delivery obligation alongside issue creation. | Same §2.13 |
| **Default status mapping convention** | Implementations should use a **configurable per-tenant mapping** with a sensible default: Jira `To Do` → ArchLucid `Open`; `In Progress` → `InProgress`; `Done` → `Resolved`. ServiceNow `New`/`In Progress` → `Open`/`InProgress`; `Resolved`/`Closed` → `Resolved`. Operators may override via tenant config; schema stays Authority-shaped. | Connector implementation, tenant configuration docs |
| **Auth pattern** | Jira: **API Token (Basic Auth)** for the **V1.1** MVP; OAuth 2.0 is a fast-follow if a buyer requires it. ServiceNow: **Basic Auth (username + password)** for the **V1.1** MVP; OAuth 2.0 follow-on. Both follow existing Key Vault secret-name reference pattern. | Connector secrets config |
| **Scope guardrail** | Bidirectional sync covers **finding/issue state** only. Rich-field sync (comments, attachments, custom fields) is **not** committed for **V1.1**. | Connector delivery scope |

---

## Resolved 2026-05-05 (Commerce cutover sequencing — item 22 partial)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Stripe vs Marketplace order** | **Staged:** **Stripe production (`sk_live_` / live webhooks) first** — validate card checkout + webhook receipts in production before **Partner Center Marketplace** “Go live” for the SaaS offer. | [`runbooks/STRIPE_OPERATOR_CHECKLIST.md`](runbooks/STRIPE_OPERATOR_CHECKLIST.md), Marketplace publication runbooks |
| **Rollback ownership** | **Joseph Francis** (owner / sole operator today) owns **rollback and forward decision** on **both** transitions; after LLC cutover refresh runbooks to the delegated officer role as counsel directs. | Incident comms during cutover; aligns with Stripe webhook ops row in **item 9** |
| **Still open until un-held** | **Calendar**, customer comms if checkout paused, **`STAGING_ONCALL_WEBHOOK_URL`**, preflight checklist operator for Marketplace flip (likely same owner unless delegated), confirming staging stays Stripe **TEST**. | **`item 22` body** bullets **(b)–(e)** |

---

## Resolved 2026-05-05 (Next workflow breadth — item 4)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Primary “next bet” after GitHub + ADO** | **Deeper Microsoft-native** workflow surfaces — expand **Teams** notification depth, **Logic Apps** / edge fan-out, and related Microsoft-native paths per [ADR 0019](architecture/adrs/0019-logic-apps-standard-edge-orchestration.md), rather than taking a **second lap** on ITSM-only polish as the **primary** follow-on theme. | Integration roadmap, ADR 0019 sequencing, `INTEGRATION_CATALOG.md` narrative |
| **Scope guardrails** | **Updated 2026-05-18:** first-party **ServiceNow**, **Jira**, **Confluence**, and **Slack** are **V1.1** ([`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13–§2.15; build order **ServiceNow** → **Confluence** → **Jira**, **Atlassian paired**). This decision **orders optional breadth** and engineering emphasis **after** those commitments — it does **not** delete them. | Prevents misread as ITSM descope |

---

## Resolved 2026-05-05 (VPAT posture — item 26)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Formal VPAT on Trust Center** | **Not for now.** Procurement audiences get **WCAG self-attestation** via root [`ACCESSIBILITY.md`](../ACCESSIBILITY.md), marketing route **`/accessibility`**, Trust Center artifact row (“Accessibility self-attestation review”), and ongoing axe-core/eslint pipeline — see **Resolved 2026-04-29** WCAG mailbox + **item 12** in this file. | Trust Center prose; VPAT authoring effort deferred |
| **Revisit trigger** | Re-evaluate VPAT when a **named buyer cohort** routinely requires ICT VPAT-style documentation (e.g. disciplined public-sector RFP cadence). | Sales / GTM intake |

---

## Resolved 2026-05-05 (Public pricing surface — item 13)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Marketing site list prices** | **Publish publicly** on `/pricing` for **every standard paid tier except Enterprise** — amounts stay aligned to **locked list prices** in [`PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) and merge-blocking CI guards. | `archlucid-ui` marketing pricing, Stripe/Marketplace alignment |
| **Enterprise** | **Not** a public list price on marketing — **quote / contact sales / order form** path only (anonymous quote request + inbox flow remains valid). | Copy on Enterprise card; no implied public Enterprise dollar figure |

---

## Resolved 2026-05-05 (Reference publication owner — items 7 / 19)

| Sub-decision | Decision | Affects |
|---|---|---|
| **First PLG / paying-tenant graduation to `Published`** | **Owner solo** — monitors trial-to-paid, coordinates case-study draft validation with the customer, and updates the table row in [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md) from **`Customer review`** → **`Published`** per that file’s workflow. Revisit if a CS hire owns this later. | Items **7** (64.14 assessment) and **19** (67.61 assessment); [`PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) §5.4 CI guard; aggregate ROI bulletin gate (item **27**) |

---

## Resolved 2026-05-29 (assurance V1.1 backlog — assessment #23 / #25)

| Sub-decision | Decision | Affects |
|---|---|---|
| **SOC 2 CPA attestation program (assessment #23)** | **V1.1 backlog** — track as **TB-135** in [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md). Not a V1 assessment implementation batch; pick up only when owner directs. ARR/procurement trigger unchanged (*Resolved 2026-05-05*). | **`.cursor/rules/V1_1-assurance-backlog.mdc`**, [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c, [`SOC2_ROADMAP.md`](go-to-market/SOC2_ROADMAP.md) |
| **Third-party pen-test program (assessment #25)** | **V1.1 backlog** — track as **TB-136**. Supersedes prior **V2** framing for external vendor engagement. V1 remains owner-conducted (**TB-005**). Not a V1 assessment implementation batch. | Same rule + [`pen-test-summaries/`](security/pen-test-summaries/) templates |

---

## Resolved 2026-05-30 (real pilot proof cohort data policy)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Allowed input data classes** | **All three are allowed** for the V1.1 real pilot proof packet cohort: customer data, sanitized internal data, and demo-only data. | [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md) TB-141, [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6b |
| **Safety conditions** | Customer data requires tenant/customer authorization and normal privacy boundaries. Sanitized internal data must preserve redaction. Demo-only data must remain visibly labeled as demo/synthetic. Sponsor-send status still depends on execution mode, PilotStrict, ROI source basis, proof disposition, and redaction/caveat checks. | Proof-packet acceptance criteria, sponsor-safe GTM claims |

---

## Resolved 2026-05-30 (broader-claims threshold source)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Threshold source of truth** | Use [`GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md) § *Proof-gated rollout criteria* as the authoritative threshold for moving from controlled pilots to broader claims. Do not create a second threshold in assessment or backlog docs. | [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md) TB-141, assessments, GTM planning |
| **Current summary** | Stage 1 evidence-backed selling requires G1–G4 all green for at least three distinct real pilot runs. Stage 2 broad GTM / scale claims require G1–G6 all green plus the published/permissioned reference condition recorded in the GTM backlog. | Proof-packet cohort planning, sales claim guardrails |

---

## Resolved 2026-05-30 (first proof-density cohort scenarios)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Scenario 1** | **AI / LLM workload governance** using `templates/starter-proof-packs/ai-llm-workload/`. This proves the core AI-governance buyer job and stresses faithfulness-friendly citations. | [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md) TB-141, proof cohort planning |
| **Scenario 2** | **Regulated SaaS procurement / SOC-style diligence** using `templates/starter-proof-packs/regulated-saas-soc-procurement/`. This proves procurement-safe caveats without claiming CPA SOC 2 or third-party assurance. | TB-141, GTM proof narrative |
| **Scenario 3** | **Azure cost / orphan / governance review** using `templates/starter-proof-packs/azure-cost-governance/`. This proves ROI/source-label discipline and Azure-native buyer value. | TB-141, proof-of-ROI evidence |
| **Later vertical candidate** | **Healthcare data workflow** remains useful but is not in the first three because it is more vertical-specific and carries extra PHI/certification overclaim risk. | Future proof cohort planning |

---

## Resolved 2026-05-30 (market-facing demo asset evidence policy)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Real-mode output in public assets** | **Allowed.** Real-mode output may be shown in market-facing screenshots, video, and sales copy when the underlying data/output is authorized for publication, redacted, source-labeled, and caveated. | [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md) TB-142, GTM asset production |
| **Synthetic/demo fallback** | Synthetic/demo-labeled assets remain allowed and should be used when real output is not approved, is too sensitive, or would imply unsupported customer proof. | [`WHAT_NOT_TO_PROMISE.md`](go-to-market/WHAT_NOT_TO_PROMISE.md), public claims review |
| **Limits** | Do not imply public customer proof, production SLA, CPA SOC 2, third-party validation, or broad real-LLM validation unless separate evidence exists. | Promise-language checks, publication approval |

---

## Resolved 2026-05-30 (first demo asset channel)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Primary channel** | **Upwork first.** The first market-facing demo asset pass should optimize for Upwork proposals/profile proof, where concise proof, narrow buyer jobs, and claim discipline matter most. | [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md) TB-142, GTM asset production |
| **Reuse channels** | Website, sales email, LinkedIn, and live demo can reuse and adapt the Upwork-first asset system later; they are not first-pass optimization targets. | Future GTM asset production |

---

## Resolved 2026-05-30 (third-party pen-test customer wording)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Customer-facing phrase** | Use **"planned, not yet scheduled"** for the third-party pen-test program in buyer-facing materials. Do not expose "V1.1 backlog" or TB IDs in customer-facing wording unless the buyer specifically asks for roadmap internals. | `TRUST_CENTER.md`, `trust-center.md`, procurement responses |
| **Internal tracking** | Keep internal planning and assessment scope tracking as TB-136 / V1.1 backlog so coding agents do not reintroduce the item as a V1 assessment defect. | [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md), [`V1_DEFERRED.md`](library/V1_DEFERRED.md), Cursor rules |

---

## Resolved 2026-05-30 (SOC 2 readiness timing wording)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Trust Center timing language** | **Yes, continue citing the ARR/procurement trigger** for SOC 2 Type I engagement: **$250K ARR** or the first binding procurement requirement from a contracted customer, whichever is earlier. | `TRUST_CENTER.md`, `SOC2_ROADMAP.md`, procurement responses |
| **Wording guardrail** | Keep the language directional and non-contractual; do not imply a CPA report is issued, scheduled, or committed before the trigger is met and an assessor engagement is executed. | Trust Center and SOC 2 roadmap |

---

## Resolved 2026-05-30 (Azure example region and naming)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Example Azure region** | Use **East US** (`eastus`) as the default region in examples unless a specific environment or residency requirement says otherwise. | Azure examples, runbooks, Terraform snippets |
| **Example naming convention** | Use Microsoft-standard Azure naming conventions: Cloud Adoption Framework-style resource type abbreviations, lowercase where Azure requires it, workload/environment/region/instance tokens, and provider-specific uniqueness rules for globally unique names such as storage accounts and container registries. | Azure examples, Terraform docs, procurement/runbook snippets |

---

## Resolved 2026-05-30 (hosted production Terraform root)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Authoritative hosted production root** | Use **`infra/terraform/prod`** as the authoritative Terraform root for the hosted production footprint. | `docs/library/IAC_RUNTIME_PARITY.md`, hosted production IaC docs, assessment pending questions |
| **Interpretation** | When docs say "authoritative hosted SaaS stack" for production, read that as `infra/terraform/prod` unless a future owner decision renames or replaces the root. Validation/module roots may exist, but production-like examples should converge on this root. | Terraform backlog, Azure deployment examples |

---

## Resolved 2026-05-30 (Azure OpenAI and Search Terraform composition)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Hosted SaaS default** | Compose **Azure OpenAI** and **Azure AI Search** into `infra/terraform/prod` by default so production-like LLM and retrieval dependencies are provisioned, networked, tagged, and validated with the API/worker environment. | `docs/library/IAC_RUNTIME_PARITY.md`, Terraform backlog, hosted deployment examples |
| **Reuse boundary** | Keep reusable modules or temporary separate roots only for focused validation, migration staging, or specialized deployments where OpenAI/Search are intentionally supplied by an existing enterprise landing zone. The composed hosted stack should be the default path in docs and examples. | `infra/terraform-openai`, future Search Terraform work |
| **Rationale** | Composing required hosted dependencies reduces portal drift, avoids partial "production-like" environments, keeps private endpoints/RBAC/tags/diagnostics consistent, and gives procurement reviewers one apply/plan story. Separate roots are useful for development but should not be the default operator mental model. | IaC parity, security, deployability, reliability |

---

## Resolved 2026-05-30 (signup.archlucid.net DNS cutover readiness)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Hostname ownership** | **`signup.archlucid.net`** is **owned** by the operator. | Commerce un-hold prerequisite checklist, trial signup DNS planning |
| **Cutover readiness** | DNS is **ready for cutover** to the production Front Door custom domain when the owner executes commerce un-hold. | [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6b commerce-un-hold row, [`runbooks/STRIPE_OPERATOR_CHECKLIST.md`](runbooks/STRIPE_OPERATOR_CHECKLIST.md) |
| **Guardrail** | **Ready ≠ cut over.** Staging workflows and trial-funnel CI must **not** point production traffic at this hostname until live Stripe keys, production webhook secrets, and the owner’s explicit un-hold approval land on the same change window. | [`.github/workflows/trial-funnel-test-mode.yml`](../.github/workflows/trial-funnel-test-mode.yml), assessment pending questions |

---

## Resolved 2026-05-30 (Team self-serve Stripe SKU at launch)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Launch SKU shape** | **Yes** — at commerce un-hold launch, Team self-serve stays the **interim bundled Stripe Price** (one recurring **`Billing:Stripe:PriceIdTeam`**, **$249**/month USD per [`PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) § **3.2**). | [`STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md), [`runbooks/STRIPE_OPERATOR_CHECKLIST.md`](runbooks/STRIPE_OPERATOR_CHECKLIST.md), `archlucid-ui/public/pricing.json` |
| **Deferred split** | Do **not** block launch on per-component Checkout line items or metered seat/workspace decomposition in Stripe. Quotes and order forms may still use § **5.2** decomposition; self-serve Checkout remains one bundled total. | Stripe integration backlog, commercial packaging docs |
| **Grandfathering** | Existing § **3.2** grandfather policy remains in force for subscriptions that start at **$249**. | Billing ops, renewal notices |

---

## Resolved 2026-05-30 (Enterprise UI design system rollout sequencing)

**Owner delegation (2026-05-30):** sequencing decided by engineering assessment — **not** a single big-bang pass across all shared components and routes.

| Wave | Scope | Rationale |
|---|---|---|
| **0 — Primitives** | Design tokens (**TB-114** UI cluster), canonical status tags (**TB-116**), `EnterpriseTable` (**TB-117**), Carbon conformance Cursor rule (**TB-120** UI cluster) | Every page pass depends on shared semantics; avoids one-off palette/badge/table drift |
| **1 — First-pilot + run detail** | Home first-pilot command-center rows, onboarding/new-review wizard, reviews list entry, **buyer-polished run detail** (proof disposition, deliverables, findings, exports) | Highest buyer/sponsor visibility; matches golden path in [`FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| **2 — Home / dashboard** | Operator Home executive ROI summary, first-value CTAs, sample-review entry cards | Sponsor-facing value after wave 1 tables/tags exist |
| **3 — Governance / Operate** | Governance dashboard, findings, audit log, policy packs, alerts inbox tables | Operate layer is post-commit; benefits from status tags + `EnterpriseTable` from wave 0 |
| **4 — Polish** | Surface/card audit (**TB-115** UI cluster), spacing (**TB-118**), typography (**TB-119**), remaining shared cards | Cross-cutting cleanup after route priorities stabilize |

**Explicitly not in scope for wave 0–1:** rewriting all `archlucid-ui/src/components/` in one PR, full marketing-site reskin, or business-logic/API contract changes.

**Canonical standard:** [`UI_DESIGN_SYSTEM.md`](library/UI_DESIGN_SYSTEM.md). **Backlog IDs:** UI design-system cluster at end of [`TECH_BACKLOG.md`](library/TECH_BACKLOG.md) (same TB numbers as accelerator cluster — read section headings, not IDs alone).

---

## Resolved 2026-05-30 (Azure AI Search index field contract)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Authoritative source** | **`docs/library/AZURE_AI_SEARCH_INDEX_CONTRACT.md`** + `AzureSearchSdkClient` / `AzureSearchTenantScopeFilterBuilder` — **not** an ad-hoc portal or out-of-repo schema. | TB-096 Terraform, TB-071 production client, retrieval ops |
| **Tenant / workspace / project** | Index fields **`tenantId`**, **`workspaceId`**, **`projectId`** — `Edm.String`, GUID **D** format. | OData scope filters on every search/delete |
| **Corpus kind** | Index field **`corpusKind`** — string enum name (`Conversation`, `TenantManifest`, `PolicyPack`, …). | Platform corpus OR branch in scope filter |
| **Document id** | Index field **`documentId`** — logical parent id. | Scoped delete by document |
| **Chunk key** | Index field **`chunkId`** — Azure Search **document key**. | Upsert + delete batch |
| **Vector content** | Index field **`embedding`** (`Collection(Edm.Single)`). **Not** `vectorContent`. | VectorizedQuery target |
| **Lexical content** | Index field **`text`**. | Hit snippet / future lexical search |
| **External index reconciliation** | Rename/migrate/reindex to this contract; do not configure ArchLucid against alternate field names without a code change. | Hosted prod cutover, customer LZ indexes |

---

## Resolved 2026-05-05 (SOC 2 ARR trigger — item 6)

| Sub-decision | Decision | Affects |
|---|---|---|
| **SOC 2 Type I engagement trigger** | **$250K ARR** OR **first binding procurement requirement from a contracted customer**, whichever is earlier. Below that threshold: self-assessment + Trust Center honesty posture unchanged. | [`docs/go-to-market/TRUST_CENTER.md`](go-to-market/TRUST_CENTER.md) compliance table, [`docs/go-to-market/SOC2_ROADMAP.md`](go-to-market/SOC2_ROADMAP.md), [`docs/security/SOC2_SELF_ASSESSMENT_2026.md`](security/SOC2_SELF_ASSESSMENT_2026.md) G-001 resumption checklist |
| **Rationale** | Type I all-in cost ($20K–$45K) is ~10–18% of $250K ARR — manageable. Procurement-blocking request is the other hard signal regardless of ARR. Starting at $250K puts a Type II report in reach (~$500K–$750K ARR) — the range where enterprise buyers get serious. | Sales narrative; do not imply SOC 2 is imminent or contractually committed below the trigger |

---

## Resolved 2026-05-05 (Quote CRM routing — Decision Velocity)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Quote-request SLA / routing** | **Owner solo** — **`Email:PricingQuoteSalesInbox`** / quoted-path notifications are handled personally; no separate CRM operator or round-robin yet. `dbo.MarketingPricingQuoteRequests` remains the durable record. | [`docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md), marketing copy expectations (“we’ll follow up”) |
| **HubSpot (or similar) product integration** | **Out of scope until V2** — not a committed V1/V1.1 build; reassess when inbound volume or team size warrants automated CRM sync. | Roadmap; do **not** block shipping on CRM webhooks or OAuth to HubSpot |

---

## Resolved 2026-05-05 (H1 GTM motion — Decision Velocity)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Primary H1 motion** | **Design-partner–led** — named deep engagements stay the **main** focus for the remainder of H1. | Sales narrative, success metrics, product feedback loop |
| **Parallel motion** | **Also** pursue **independent paid or trial** users when opportunity appears — not exclusive to design partners. | Trial funnel, self-serve polish, lighter-touch onboarding must stay viable alongside partner work |

---

## Resolved 2026-05-05 (Paid proposal readiness bar — Decision Velocity)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Preferred internal signal** | **Reasonable default:** at least one **committed Golden Manifest** grounded in the prospect’s **real architecture context** before treating the deal as “seriously validated.” | Pilot guidance, sponsor expectations, product-led proof |
| **Hard gate?** | **No.** Owner **remains open to revenue** — procurement, budget, timing, or relationship can justify a paid proposal **without** that artifact; this is **judgment**, not an automatic disqualifier. | Sales flexibility; docs must not imply an absolute rule |

---

## Resolved 2026-05-05 (SIEM + guided sandbox — product posture)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Custom SIEM / webhook outbound mapping** | **JQ.** Per-destination filter (nullable = pass-through); validate expression at configuration save; evaluate at dispatch. Optional “simple mapping” UI may generate JQ later; canonical stored form is JQ. | Webhook config schema, outbound delivery pipeline, operator docs, synthetic webhook test UX |
| **Guided sandbox / PLG “try before Azure”** | **Client-side mock in the UI** — guided experience with deterministic mock data; **no** requirement for local infrastructure. | Marketing/operator onboarding UX |
| **Docker Compose / local DB for non-developers** | **Out of scope for tenants and buyers.** ArchLucid is **SaaS.** **Docker Compose** (and similar local stacks) are **only** for **people developing this product** in-repo — not a supported path for customer install or evaluation. **Do not** document or imply compose-based eval for prospects. | `START_HERE.md` audience split, trial docs, any “local pilot” narratives |

---

## Resolved 2026-05-05 (Jira + ServiceNow — promoted to V1 scope)

> **Headline superseded (2026-05-18):** Release window for these connectors is **V1.1** per *Resolved 2026-05-18 (First-party connectors — V1.1 window)*. Substance below is **retained**.

| Sub-decision | Decision | Affects |
|---|---|---|
| **First-party Jira connector** | **In scope for V1.1** (historically: **V1 GA**) — committed product obligation per [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) §2.13 (issue create + correlation back-link; **bi-directional** Jira → ArchLucid status sync — firm obligation per *Resolved 2026-05-06*). **Supersedes** prior V1.1-only pinning from 2026-04-23 / 2026-04-24 for **Jira** only. | [`V1_SCOPE.md`](library/V1_SCOPE.md), [`INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), recipe index cross-links |
| **First-party ServiceNow connector** | **In scope for V1.1** (historically: **V1 GA**) — same §2.13 (finding → `incident`; optional `cmdb_ci` planning unchanged; **two-way** ServiceNow → ArchLucid **status-only** sync per *Resolved 2026-05-06* — supersedes prior “not committed unless owner adds” language). **Supersedes** prior V1.1-only pinning for **ServiceNow** only. | Same |
| **Engineering sequencing** | **Superseded 2026-05-05** for Atlassian ordering — see *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*. **ServiceNow** remains before the **Atlassian** tranche. | ITSM ADRs, implementation plan |
| **Customer-owned recipes** | **Optional** bridges (Power Automate / Logic Apps / templates) align with the **V1.1** buyer contract for event/ITSM-shaped automation — they do **not** replace the **V1.1** first-party commitment. | [`docs/integrations/recipes/README.md`](integrations/recipes/README.md) |

---

## Resolved 2026-05-05 (Confluence — promoted to V1 GA)

> **Headline superseded (2026-05-18):** **Confluence** first-party connector delivery is **V1.1** per *Resolved 2026-05-18*. Substance below is **retained**.

| Sub-decision | Decision | Affects |
|---|---|---|
| **First-party Confluence connector** | **In scope for V1.1** (historically: **V1 GA**) — one-way publish to **`Confluence:DefaultSpaceKey`**; API token / basic auth MVP; OAuth follow-on; **before** **Jira** in the **paired Atlassian** workstream (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*). **Supersedes** Improvement 3 “V1.1 only” deferral (*2026-04-24*) and [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6 prior table. | [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.15, [`INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), [`CHANGELOG.md`](CHANGELOG.md) |

---

## Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Build order (V1.1)** | **ServiceNow** first (§2.13). Then **Atlassian pair**: **Confluence** documentation publish **before** **Jira** issue sync — engineer **Confluence** and **Jira** as **one workstream** / **same release tranche** (shared tenant configuration, credentials discipline, rollout). **Jira** is **not** a prerequisite for **Confluence**. **Supersedes** prior **ServiceNow → Jira → Confluence** ordering from *Resolved 2026-04-27* / **2026-05-05** Confluence-promotion rows for **Atlassian** only. | [`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13 / §2.15, [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6, [`INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), [`ITSM_BRIDGE_V1_RECIPES.md`](library/ITSM_BRIDGE_V1_RECIPES.md) |

---

## Resolved 2026-05-03 (Design partner vs V1 headline assessments)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Design partner as product/pilot gate** | **Not a V1 gate.** Closing a **signed design partner** (per [`docs/go-to-market/PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md)) is a **V1.1** commercial motion alongside reference-customer publication — see [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §6b. | V1 GA and Core Pilot remain defined by [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) without a design-partner prerequisite. |
| **Assessment scoring and narrative** | **`(A)` must not drop** for lacking a design partner. **Do not** list “no design partner yet” as a headline defect, recurring open question, or scored pillar gap unless the user explicitly asked for **GTM pipeline** depth — then **`(B)` informational** only (zero weight on **`(A)`**). | `.cursor/rules/Assessment-Scope-V1_1.mdc`; future independent assessments. |

---

## Resolved 2026-04-27 (Post-Assessment Q&A)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Default Authentication Strategy for SaaS vs. On-Prem** | **Require Entra ID configuration or a static API key.** The open `DevelopmentBypassAll` default must not be the production posture. | `ArchLucid.Api/Auth/Models/ArchLucidAuthOptions.cs`, `docs/library/` |
| **Unify Error Responses for Hidden UI Features** | **404 Not Found.** Restricted API routes will return 404 instead of 403 to prevent feature and resource enumeration by unauthorized tiers/roles. | `ArchLucid.Api/Filters/CommercialTenantTierFilter.cs`, `ArchLucid.Api.Tests/`, Operator UI interpretation logic. |

**Refined 2026-04-28 (Assessor B):** for **tenant-scoped** run/manifest APIs, owner prefers **403** with clear Problem Details for **debuggability**; **404** remains preferred for **admin** surfaces. See **Resolved 2026-04-28** — implementation work reconciles this split with the filter above on a per-route basis.

### Resolved 2026-04-27 (ITSM V1.1 first-party implementation priority)

**Superseded in part (2026-05-05; headline window 2026-05-18):** **ServiceNow**, **Jira**, and **Confluence** are **V1.1** first-party commitments ([`V1_SCOPE.md`](library/V1_SCOPE.md) §2.13–§2.15; *Resolved 2026-05-18*). **Atlassian** build order from this 2026-04-27 note (**ServiceNow** before **Jira** before **Confluence**) is **superseded** by *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*. **ServiceNow**-before-**Atlassian** remains.

| Sub-decision | Decision | Affects |
|---|---|---|
| **First-party ITSM / Atlassian connector build order** | **Historical:** **ServiceNow first**, then **Jira**, then **Confluence**. **Current (2026-05-05):** **ServiceNow** → **Confluence** → **Jira** (paired Atlassian workstream) — see *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*. Does **not** alter Microsoft-native preference (Teams, Logic Apps, ADO, GitHub) as the primary integration anchor. | [`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) §2.13–§2.15, [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §6, [`docs/go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md), ITSM planning ADRs |

---

## Resolved history (2026-04-21 — 2026-04-28)

Verbatim owner tables through **2026-04-28** (assessor B, ten-improvement Q&A, and earlier batches) live in **[`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md)** (Parts A–C). *Still open* items below retain links — where they used to say "see table above", read the matching archive section.

---

## Still open (needs your input later)

1. **Design-partner row (`DESIGN_PARTNER_NEXT`)** — When a **named** design partner (not PLG) is authorized, replace `<<CUSTOMER_NAME>>` in [`DESIGN_PARTNER_NEXT_CASE_STUDY.md`](go-to-market/reference-customers/DESIGN_PARTNER_NEXT_CASE_STUDY.md) and move the table row through **Drafting → Customer review → Published** per [`reference-customers/README.md`](go-to-market/reference-customers/README.md).

2. **External pen-test vendor (third-party)** — **V1.1 backlog (TB-136)** — when funded, select vendor, award SoW, fill `<<vendor>>` / `<<TBD>>` in [`docs/security/pen-test-summaries/2026-Q2-SOW.md`](security/pen-test-summaries/2026-Q2-SOW.md), and replace placeholders in [`2026-Q2-REDACTED-SUMMARY.md`](security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) after delivery. **Owner 2026-05-01:** there is **no** commitment to Aeronova or any other third-party vendor; **V1** pen testing is **owner-conducted** ([`2026-Q2-OWNER-CONDUCTED.md`](security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md)). **Independent quality assessments must not** penalize V1 for lacking a third-party pen test. **Not** a V1 assessment implementation prompt — see **`.cursor/rules/V1_1-assurance-backlog.mdc`**.

    - **Custodian mailbox (Resolved 2026-04-21):** **`security@archlucid.net`** is canonical. Trust Center, `SECURITY.md`, `INCIDENT_COMMUNICATIONS_POLICY.md`, and `security.txt` all aligned in this change set; the eventual PGP UID must use the same address.
    - **Release window (owner 2026-05-29):** **V1.1 backlog (TB-136)** for third-party engagement + assessor deliverables. Prior **V2** framing superseded — see [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c and [`V1_SCOPE.md`](library/V1_SCOPE.md) §3.

3. **PGP for coordinated disclosure** — [`SECURITY.md`](../SECURITY.md) now points at `archlucid-ui/public/.well-known/pgp-key.txt` as **pending** until the custodian commits the public key. **Mailbox alignment (Resolved 2026-04-21): the UID is `security@archlucid.net`.** Items 10 / 21 still own the actual key generation.

    - **Release window (Resolved 2026-04-23, sixth pass):** **V1.1.** Key generation, drop, and `SECURITY.md` / marketing `/security` updates are no longer V1 obligations — see Q12 / Q13 / Q14 in *Resolved 2026-04-23 (sixth pass — fresh independent assessment §10 owner Q&A — 17 decisions)* in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part B) and [`V1_DEFERRED.md`](library/V1_DEFERRED.md) § 6c. UID is gated on `archlucid.net` domain acquisition.

4. **Next Microsoft-aligned workflow integration** — **Resolved 2026-05-05:** **Deeper Microsoft-native** (Teams, Logic Apps / [ADR 0019](architecture/adrs/0019-logic-apps-standard-edge-orchestration.md)) as the **primary next breadth bet** after shipped GitHub + ADO anchors — see *Resolved 2026-05-05 (Next workflow breadth — item 4)* above. **Updated 2026-05-18:** **ServiceNow**, **Jira**, **Confluence**, **Slack**, **Microsoft Teams** webhook delivery, **CloudEvents** webhooks, and **recipe** bridges are **V1.1** buyer-contract obligations ([`V1_SCOPE.md`](library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3).

---

## Six quality prompts (2026-04-20 independent assessment) — execution status

| Prompt | Intent | Repo status (2026-04-21) |
|--------|--------|--------------------------|
| **8.1** Reference customer + CI guard | Case study assets, table row, merge-blocking when `Published` | **Done** (auto-flip in `ci.yml`); **extended** with PLG case study + table row in this change set. |
| **8.2** `archlucid pilot up` | One-command Docker pilot | **Done** — [`ArchLucid.Cli/Commands/PilotUpCommand.cs`](../ArchLucid.Cli/Commands/PilotUpCommand.cs). *Note:* `POST /v1.0/demo/seed` is **Development-only** and needs **ExecuteAuthority**; the Docker path relies on **demo seed on startup** instead. |
| **8.3** First-value report | CLI + `GET /v1/pilots/runs/{id}/first-value-report` | **Done** — see CHANGELOG 2026-04-20. |
| **8.4** GitHub Action manifest delta | Composite action + docs + example workflow | **Done** — `integrations/github-action-manifest-delta/`, [`docs/integrations/GITHUB_ACTION_MANIFEST_DELTA.md`](integrations/GITHUB_ACTION_MANIFEST_DELTA.md). |
| **8.5** Persistence consolidation | Proposal doc only | **Done** — [`docs/PROJECT_CONSOLIDATION_PROPOSAL_PERSISTENCE.md`](library/PROJECT_CONSOLIDATION_PROPOSAL_PERSISTENCE.md). |
| **8.6** Pen-test publication path | Templates + Trust Center | **Done** — `docs/security/pen-test-summaries/`; **extended** with owner-assessment draft + Trust Center wording in this change set. |

---

## Still open — surfaced by 2026-04-21 independent assessment

These came out of [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_64_14.md`](archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_64_14.md) § 9 and the six Cursor prompts in [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md`](archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md). Each is **owner-only** — the assistant cannot answer them from repository state.

5. **External (third-party) pen-test scope and budget** — **V2** — vendor selection, scope (web app only / web + infra / web + infra + LLM threat model), test window, funding. Picks up where item 2 above leaves off. **Does not** gate V1; V1 uses **owner-conducted** pen testing per [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c.

6. **SOC 2 Type I assessor + audit period start date** — **ARR trigger resolved 2026-05-05.** Trigger: **$250K ARR** OR **first binding procurement requirement from a contracted customer**, whichever is earlier. Interim posture unchanged: self-assessment + Trust Center honesty. Trust Center compliance row updated to reflect this. See *Resolved 2026-05-05 (SOC 2 ARR trigger)* below.

7. **Reference-customer publication ownership and discount-for-reference percent** — **Discount Resolved 2026-04-21:** **15% standardized.** `PRICING_PHILOSOPHY.md` § 5.4 was promoted from "suggested" to "standard" in this change set. **Publication owner Resolved 2026-05-05:** **owner solo** — see *Resolved 2026-05-05 (Reference publication owner)* below.

8. **Marketplace publication go-live decision** — sign off on Azure Marketplace SaaS plan SKUs (aligned to PRICING_PHILOSOPHY tiers), legal entity, lead-form webhook URL. Prompt 3 pre-builds the alignment guard and the publication checklist diff; cannot create a real listing.

    - **Needed from owner:** (a) **Partner Center publisher / seller** identity (**Resolved 2026-04-27:** Joseph Francis (Sole Proprietorship) — **planned successor:** Francis Architecture, LLC per [`runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md), which supersedes this sub-row only after execution + `CHANGELOG.md`); (b) **Microsoft Partner ID / publisher id** and the transactable **offer id** to load into `Billing:AzureMarketplace:MarketplaceOfferId` for production (CI alignment: `python scripts/ci/assert_marketplace_pricing_alignment.py`); (c) **Tax profile + payout bank account** completion in Partner Center; (d) **Landing page URL** (**Resolved 2026-04-27:** `https://archlucid.net/signup`); (e) confirmation the **webhook** `https://<api-host>/v1/billing/webhooks/marketplace` is registered and JWT validation metadata (`OpenIdMetadataAddress`, `ValidAudiences`) matches the app registration Microsoft will call; (f) explicit **go-live date** and who records it in `CHANGELOG.md`.

9. **Stripe production go-live policy decisions** — chargeback / refund / dunning text for the order-form template; legal entity name on customer statements; live API key + webhook secret. Prompt 3 lands the production-safety guards but no live keys.

    - **Needed from owner:** (a) **Statement descriptor** / customer-facing legal name as it should appear on card statements (**Resolved 2026-04-27:** `ARCHLUCID PLATFORM`); (b) **Chargeback, refund, and dunning** policy text for [`ORDER_FORM_TEMPLATE.md`](go-to-market/ORDER_FORM_TEMPLATE.md) and Trust Center (**Resolved 2026-04-27:** text reviewed and approved by owner); (c) **`sk_live_` + `whsec_` live signing secret** injected only via Key Vault / deployment secret store (never committed) and webhook endpoint URL `https://<prod-api-host>/v1/billing/webhooks/stripe` registered in Stripe **live** Dashboard; (d) who **owns** rotation and incident response if webhook delivery fails after deploy (**Resolved 2026-04-27:** Joseph Francis — after [`runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`](runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md), update runbooks to the LLC **officer role** / named delegate as counsel directs).

10. **PGP key for `security@archlucid.net`** — owner generates the key pair (or designates a custodian) and drops the public key into `archlucid-ui/public/.well-known/pgp-key.txt`. The CI guard in Prompt 4 turns green automatically the moment the file appears.

    - **Custodian mailbox (Resolved 2026-04-21):** **`security@archlucid.net`** is canonical. Generation + custodian-naming still owner-only.

11. **Workflow-integration sequencing — Resolved 2026-05-05 (scope update); Slack + Confluence promoted 2026-05-05; Atlassian pair 2026-05-05; headline window 2026-05-18.** **ServiceNow** and **Jira** first-party connectors are **V1.1** ([`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) §2.13). **Slack** first-party outbound chat-ops is **V1.1** ([`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) §2.14) — supersedes prior *Resolved 2026-04-23* Slack-as-V2-only row in [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §6a. **Confluence** first-party documentation publish is **V1.1** ([`docs/library/V1_SCOPE.md`](library/V1_SCOPE.md) §2.15) — supersedes Improvement 3 **V1.1-only** deferral for calendar purposes; see *Resolved 2026-05-05 (Confluence — promoted to V1 GA)* for history. **Engineering order:** **ServiceNow** → **Confluence** → **Jira** — **Atlassian** engineered **together** in one tranche, **Confluence** first (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*). Prefer **Microsoft-native** options (**Teams** — shipped **V1**; **Slack** — **V1.1** per §2.14; Logic Apps, ADO, GitHub) where they suffice; customer-owned recipes remain the **V1** path for ITSM/docs/chat-shaped workflows ([`docs/integrations/recipes/README.md`](integrations/recipes/README.md)).

12. **WCAG conformance publication channel — Resolved 2026-04-22 (reconfirmed 2026-04-29).** **Public `/accessibility`** on the marketing site is **canonical** (not Trust Center-only). Use **`accessibility@archlucid.net`** for accessibility reports — **not** `security@` as the advertised channel for WCAG-only follow-up. See **Resolved 2026-04-29** above, [`CHANGELOG.md`](CHANGELOG.md) (2026-04-22), and [`docs/security/ACCESSIBILITY_MAILBOX.md`](security/ACCESSIBILITY_MAILBOX.md).

13. **Public price list publication on marketing site** — **Resolved 2026-05-05:** show **locked list prices** on marketing for **all standard paid tiers except Enterprise**; **Enterprise** stays quote / contact-sales only. See *Resolved 2026-05-05 (Public pricing surface)* above. `PRICING_PHILOSOPHY.md` stays the **source of truth** for amounts; marketing must not diverge.

    - **Repo wiring (2026-04-22):** anonymous **`POST /v1/marketing/pricing/quote-request`** + **`dbo.MarketingPricingQuoteRequests`** capture intent when live checkout is not the chosen path (**especially Enterprise**); **`Email:PricingQuoteSalesInbox`** (default **`sales@archlucid.net`**) receives a transactional notification after SQL persist when **`Email:Provider`** is not **`Noop`** ([`docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md)). **CRM:** owner solo until V2 — see *Resolved 2026-05-05 (Quote CRM routing)*.

14. **Cross-tenant pattern library — Accepted 2026-05-03.** **ADR 0031** is **Accepted** ([`docs/architecture/adrs/0031-cross-tenant-pattern-library.md`](architecture/adrs/0031-cross-tenant-pattern-library.md)). Implementation PRs (SQL aggregates, nightly ETL, PatternInsights API, operator UI slice) **may merge** when they conform to the ADR — **RLS untouched** on tenant primaries; **dedicated MI/SP**; **k ≥ 5**; **opt-in OFF** default; **nightly projection** — not interactive elastic fan-out (**§Constraints**/**§Architecture Overview**). **Reminder:** **`DPA_TEMPLATE.md`** §10 stubs still need completion before **GA**-facing marketing claims.

15. **Golden-cohort LLM budget approval** — Prompt 6 stands up a nightly golden-cohort drift detector. Owner approves a dedicated Azure OpenAI deployment + estimated monthly token budget for the nightly run.

    - **Shipped (simulator, no new Azure spend):** `archlucid golden-cohort lock-baseline [--cohort <path>] [--write]` captures committed-manifest SHA-256 fingerprints against a **Simulator** API host; `.github/workflows/golden-cohort-nightly.yml` can run drift assertions when repository variable `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED` is set to `true` (cohort JSON must contain non-placeholder SHAs first — see item 33).
    - **Still gated on this item:** optional **real-LLM** cohort execution remains behind `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` plus injected Azure OpenAI secrets on a protected GitHub Environment (the assistant does not provision deployments or spend).
    - **Budget (Resolved 2026-04-23, sixth pass):** **$50/month approved** at the same ceiling as the prior 2026-04-22 resolution. New **Improvement 11** in [`QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md`](archive/root-superseded-2026-05-01/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md) §3 covers the cost-and-latency dashboard + nightly kill-switch. Azure OpenAI deployment provisioning + secret injection on the protected GitHub Environment **remain owner-only operational tasks**.

16. **ADR 0021 Phase 3 — owner policy (Prompt 2 landed code + stopped at gate)** — Phase 2 catalog (`AuditEventTypes.Run.*` + dual-write), `IRunCommitOrchestrator` façade, and parity probe tooling shipped **2026-04-21**; Phase 3 **deletion** PRs remain blocked until ADR 0021 exit gates **(i)–(iv)**.
    - **Legacy `CoordinatorRun*` sunset (Resolved 2026-04-21):** **2026-05-15.** Product not yet released, so the strangler is being accelerated; the prior `Sunset: 2026-07-20` deprecation-header value drops to `Sunset: 2026-05-15` atomically across deprecation headers, parity-probe doc, [ADR 0029](architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md), and any client SDK release notes (see this change set). The earlier Draft [ADR 0028 — completion scaffold](architecture/adrs/0028-coordinator-strangler-completion.md) is marked Superseded by 0029.
    - **Parity probe write path (Resolved 2026-04-21; workflow retired 2026-05-05 — PR B):** **Auto-commit to `main`** was acceptable when **`coordinator-parity-daily.yml`** existed (**`contents: write`** granted). **Phase 3 PR B** ([ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md)) removed that workflow — historical record only.
    - **ADR 0022 lifecycle (Resolved 2026-04-21, updated same-day follow-up):** Flip to **Superseded** by a Phase 3 **deletion** ADR **inside PR A itself** — gate (iv) was waived for pre-release per [ADR 0029](architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md), so there are no 14-rows to wait for; PR A merging is the trigger.
    - **Phase 3 PR A authorship (Resolved 2026-04-21 follow-up):** **Assistant drafts PR A end-to-end** in this repo (concretes + interfaces deletion, DI sweep, `DualPipelineRegistrationDisciplineTests` allow-list shrink, OpenAPI snapshot regen). **Queued for a dedicated session** — large surgical change set, deserves its own clean turn (will not be bundled with smaller items). Sequencing intent: ship the per-trigger Teams matrix + RLS object-name SQL migration session **first**, then PR A.
    - **Phase 3 gate (iv) — pre-release waiver (Resolved 2026-04-21 follow-up):** Waived alongside gate (i) for the pre-release window. Both gates restore automatically when V1 ships to a paying customer. See [ADR 0029](architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md) § Operational considerations for the rationale.

17. **Vertical starter — public-sector regulatory framing (Prompt 11)** — **Resolved 2026-04-21: ship BOTH** EU/GDPR (existing `templates/briefs/public-sector/`, `templates/policy-packs/public-sector/`) **and** US (FedRAMP / StateRAMP — new `templates/briefs/public-sector-us/`, `templates/policy-packs/public-sector-us/`). Wizard exposes a clear picker label.

    - **CJIS overlay scope (Resolved 2026-04-21 follow-up):** **FedRAMP Moderate / NIST SP 800-53 Rev. 5 only** in v1. The CJIS Security Policy reference was dropped from policy-pack metadata, brief, wizard preset, and rule descriptions in this change set. Authoring the full CJIS Security Policy v5.9.5 control mappings (~30 controls) is a future pack rather than a v1 overlay.

18. **Vertical starter templates — tiering (Prompt 11)** — **Resolved 2026-04-21: all five verticals stay in Core Pilot / trial** for v1. No paid-tier gating on industry templates. Documented in `templates/README.md`. Re-open if packaging strategy changes.

---

## Surfaced by 2026-04-21 second independent assessment (weighted **67.61%**)

These items came out of [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_67_61.md`](archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_67_61.md) §4 and the eight Cursor prompts in [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md`](archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md). Each is **owner-only** — the assistant cannot answer them from repository state.

19. **First-paying-tenant graduation owner** — **Resolved 2026-05-05:** **Owner solo** watches the trial-to-paid transition, validates the case study draft with the customer, and flips the row in `docs/go-to-market/reference-customers/README.md` from `Customer review` to `Published`. See *Resolved 2026-05-05 (Reference publication owner)* above.

20. **Third-party pen-test execution window (V1.1 backlog — TB-136)** — when a vendor is selected under item **2**, schedule the engagement, name the customer-shareable redacted-summary review owner, decide what (if anything) is published in the public Trust Center vs NDA-gated. **Owner 2026-05-01:** no Aeronova or other vendor awarded; pick up only when owner directs TB-136.

    - **Custodian mailbox (Resolved 2026-04-21):** **`security@archlucid.net`**. All public surfaces aligned in this change set; assessor comms must use the same address.
    - **Release window (owner 2026-05-01):** **V2** — see [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c. Historical Q10 / Q11 text in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part B) reflected an earlier posture; **external** pen test is **not** a V1.1 scoring obligation.

21. **PGP key custodian for `security@archlucid.net`** — owner generates the key pair (or designates a custodian) and drops the public key into `archlucid-ui/public/.well-known/pgp-key.txt`. The CI guard added by Prompt 2 turns green automatically the moment the file appears.

    - **Custodian mailbox (Resolved 2026-04-21):** **`security@archlucid.net`** is the canonical UID. Generation + custodian-naming still owner-only.
    - **Release window (Resolved 2026-04-23, sixth pass):** **V1.1.** Key generation + drop are no longer V1 obligations — see Q12 / Q13 / Q14 in *Resolved 2026-04-23 (sixth pass)* in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part B). UID gated on `archlucid.net` domain acquisition.

22. **Marketplace + Stripe live go-live calendar — HELD (2026-04-21); V1 trial-funnel TEST-mode end-to-end shipped 2026-04-23.** Owner has not chosen a live-keys calendar; production-safety guards (CI alignment, `BillingProductionSafetyRules`, `archlucid marketplace preflight`) continue to ship and stay green, but **no live keys are flipped**. The **V1 deliverable that makes a future V1.1 commerce un-hold safe** landed 2026-04-23 (Improvement 2): the trial signup funnel now runs end-to-end on staging in **Stripe TEST mode** for sales-engineer-led product evaluation — `archlucid trial smoke --staging` (one-line PASS|FAIL + correlation id), [`archlucid-ui/e2e/trial-funnel-test-mode.spec.ts`](../archlucid-ui/e2e/trial-funnel-test-mode.spec.ts) (UI smoke, self-skips when `STRIPE_TEST_KEY` unset), nightly [`.github/workflows/trial-funnel-test-mode.yml`](../.github/workflows/trial-funnel-test-mode.yml), merge-blocking CI guard [`scripts/ci/assert_billing_safety_rules_shipped.py`](../scripts/ci/assert_billing_safety_rules_shipped.py), and a sales-engineer playbook in [`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`](runbooks/TRIAL_FUNNEL_END_TO_END.md) § 9.1. See the 2026-04-23 entry "Trial funnel TEST-mode end-to-end on staging" in [`docs/CHANGELOG.md`](CHANGELOG.md). When the owner picks a live-keys date, all four sub-items below become live decisions on that day; until then this item is intentionally parked, not abandoned.

    - **Needed from owner (when un-held):** **Partial — Resolved 2026-05-05:** **Stripe live keys + production webhooks first**, then **Marketplace go-live** (two windows acceptable). **Rollback owner** (**both stages**): **Joseph Francis** — *Resolved 2026-05-05 (commerce cutover sequencing — item 22 partial)* above. **`signup.archlucid.net` DNS ownership + cutover readiness — Resolved 2026-05-30** (*Resolved 2026-05-30 (signup.archlucid.net DNS cutover readiness)* above; cutover still waits on un-hold). **Team self-serve bundled Stripe SKU at launch — Resolved 2026-05-30:** **Yes** — keep interim **$249**/month bundled **`PriceIdTeam`** at launch (*Resolved 2026-05-30 (Team self-serve Stripe SKU at launch)* above). **Still needed:** (**b**) **calendar dates** and **communication** to early customers if checkout is briefly unavailable; (**c**) confirmation **staging** remains on Stripe **TEST** + non-production webhook secrets until flip (see [`STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md) § Staging); (**d**) who runs `archlucid marketplace preflight` + Partner Center certification checklist the day **before Marketplace** flip (defaults to **same owner** unless delegated); (**e**) the real `STAGING_ONCALL_WEBHOOK_URL` for the nightly trial-funnel workflow (currently a placeholder secret that soft no-ops when unset). **Operational strike list:** [`runbooks/STRIPE_OPERATOR_CHECKLIST.md`](runbooks/STRIPE_OPERATOR_CHECKLIST.md) (pricing § 3.2 amount, **`PriceIdTeam`**, webhook **`checkout.session.completed`**, DB verification).

23. **Microsoft Teams connector scope** — **Resolved 2026-04-21: notification-only for v1.** Two-way (approve governance from Teams) is a V1.1 candidate; no Teams app manifest registration in v1. `MICROSOFT_TEAMS_NOTIFICATIONS.md` and the Logic Apps workflow keep their notification-only posture.

    - **Per-trigger opt-in (Resolved 2026-04-21 follow-up):** **Per-trigger opt-in matrix** per connection (defaults to all-on so existing rows keep current behaviour). Costs an extra `EnabledTriggersJson NVARCHAR(MAX) NOT NULL` column on `dbo.TenantTeamsIncomingWebhookConnections` and a UI checkbox matrix on `/integrations/teams`; Logic Apps workflow filters server-side before fan-out so tenants can't be spammed with disabled triggers. **Queued for a dedicated session** — needs a SQL migration + master DDL update + UI work + tests for coverage; will be bundled with the deferred RLS object-name SQL migration since both are SQL-shaped.

24. **ADR 0021 strangler completion target date** — **Resolved 2026-04-21: 2026-05-15** (latest-by). Product not yet released, so the strangler is accelerated. **[ADR 0029 — Coordinator strangler acceleration to 2026-05-15](architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md)** is the operative decision record (it Supersedes the earlier Draft [ADR 0028 — completion scaffold](architecture/adrs/0028-coordinator-strangler-completion.md), whose `_TODO (owner)_` placeholders this Q&A answered). Deprecation `Sunset:` headers are dropped from `2026-07-20` to `2026-05-15` atomically across `ArchLucid.Api/Filters/CoordinatorPipelineDeprecationFilter.cs`, ADR 0021 § Status note, ADR 0022 § Constraints / Components / Follow-up, and `docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md` § Phase 3 gate status. **Updated 2026-04-21 follow-up:** post-PR-A 30-day soak gate **(i)** **and** parity-rows gate **(iv)** are **both waived for the pre-release window only** (rationale in ADR 0029 § Operational considerations: no published clients to protect with a soak; no customer traffic to measure with the parity probe). Gates **(ii)** and **(iii)** remain in force; both are produced inside PR A's own CI run. **Net effect:** PR A is unblocked the moment gates (ii) and (iii) clear on the deletion branch; 2026-05-15 is a latest-by deadline, not a wait-for-evidence one.

25. **Golden-cohort dedicated Azure OpenAI deployment + monthly token budget** — needed to flip the nightly real-LLM golden-cohort run from optional to mandatory. (Improvement 8 / Prompt 8 — same shape as item 15 but specific to the cohort.)

    - **Repo wiring today:** drift + lock-baseline **refuse** when `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` is truthy in the operator shell, and the placeholder `cohort-real-llm-gate` job in `golden-cohort-nightly.yml` stays disabled until this item plus secrets are in place.
    - **Needed from owner:** the same deployment/budget answers as item 15, scoped explicitly to the **20-row cohort** workload (expected longer prompts than a single interactive chat turn).
    - **Budget (Resolved 2026-04-23, sixth pass):** **$50/month approved** at the same ceiling as item 15. New **Improvement 11** adds the cost-and-latency dashboard + nightly kill-switch. Azure OpenAI deployment provisioning + secret injection on the protected GitHub Environment **remain owner-only operational tasks**.
    - **Budget portion fully Resolved 2026-04-24 (Prompt 11 / Improvement 11 shipped):** the kill-switch is wired (warn at 80% / kill at 95% of cap — Q15-conditional rule), the Azure Monitor Workbook Terraform module exists at [`infra/modules/golden-cohort-cost-dashboard/`](../infra/modules/golden-cohort-cost-dashboard/README.md), and the merge-blocking guard at [`scripts/ci/assert_golden_cohort_kill_switch_present.py`](../scripts/ci/assert_golden_cohort_kill_switch_present.py) prevents any future PR from weakening those ratios. Operator runbook: [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md). Azure OpenAI deployment provisioning + secret injection still owner-only; flipping `cohort-real-llm-gate` from `if:` to no-`if:` is an owner-only one-line PR after the deployment exists.

26. **VPAT publication decision** — **Resolved 2026-05-05:** **Stay on WCAG self-attestation** — root [`ACCESSIBILITY.md`](../ACCESSIBILITY.md), public **`/accessibility`**, and Trust Center linkage; **no** separate formal **VPAT** publication until revisit (see *Resolved 2026-05-05 (VPAT posture)* above). Adjacent **item 12** (canonical **`/accessibility`** channel) unchanged.

27. **Aggregate ROI bulletin publication cadence** — **Resolved 2026-04-21:** (a) **N = 5** for the first issue; (b) **owner-solo** sign-off; (c) **p50 + p90** both stay in v1 bulletins; (d) first publication window opens **once at least one PLG tenant is `Published`** (publication workflow owner: **Resolved 2026-05-05** — owner solo, same as item **19**). `AGGREGATE_ROI_BULLETIN_TEMPLATE.md` updated in this change set.

28. **Customer-supplied baseline soft-required at signup.** **Resolved 2026-05-03 (owner).** **`baselineReviewCycleHours`** SHOULD present as **soft-required** in onboarding (pre-filled sensible default + clear skip affordance)—implementation tracks product UX backlog; owner approves aligning copy with **`TRIAL_AND_SIGNUP.md`** / trial wizard. **`TRIAL_BASELINE_PRIVACY_NOTE.md`** copy + link treatment: **canonical public surface is `https://archlucid.net` signup/trial UX** embedding or linking repo-authored markdown per existing pattern (GitHub **`main`** remains **inspectable**, not mandatory buyer-facing). **No extra in-form disclaimers beyond** tooltip + **`TRIAL_BASELINE_PRIVACY_NOTE.md`** linkage **unless legal later requests.**

31. **Public `/why` comparison delivery** — **Resolved 2026-04-21: BOTH** PDF download (`GET /v1/marketing/why-archlucid-pack.pdf`) **and** inline page section, with a CI sync check that fails if comparison rows in `archlucid-ui/src/marketing/why-archlucid-comparison.ts` and the PDF builder diverge. Implementation tracked in this change set.

32. **Microsoft Teams notification triggers beyond v1 defaults** — **Resolved 2026-04-21: add ALL THREE** of `com.archlucid.compliance.drift.escalated`, `com.archlucid.advisory.scan.completed`, and `com.archlucid.seat.reservation.released` to the first production workflow alongside the existing `run.completed`, `governance.approval.submitted`, and `alert.fired`. Implementation tracked in this change set.

33. **Golden-cohort baseline SHA lock timing** — **Resolved 2026-04-21: lock today** from a single approved Simulator run. Operator runs `archlucid golden-cohort lock-baseline --write` after setting `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED=true`. The nightly workflow flips from "contract test only" to manifest drift report once `tests/golden-cohort/cohort.json` carries non-zero SHAs. Real-LLM cohort run (item 15 / 25) **stays gated on owner budget**.

34. **Production Simmy / fault-injection game day** — The `simmy-chaos-scheduled.yml` workflow is **staging-only** for `environment` and rejects a non-empty optional workflow_dispatch **`production`** string (fail-fast guard). **Default remains staging-only execution.** Owner must approve any real production chaos (customer notification, SLO ownership, blast radius, rollback) before any future widening of that gate. See [`docs/runbooks/GAME_DAY_CHAOS_QUARTERLY.md`](runbooks/GAME_DAY_CHAOS_QUARTERLY.md) and the calendar in [`docs/quality/game-day-log/README.md`](quality/game-day-log/README.md).

35. **Coordinator → Authority pipeline unification — sequenced multi-PR plan ([ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md))** — Phase 3 PR A's grounding read (2026-04-21) found three structural mismatches that block a single-session deletion. The ADR splits the work into PRs **A0 → A4**; the items below are the **per-sub-PR owner decisions** that have to land before the corresponding sub-PR can merge. Each is **owner-only** — the assistant cannot answer them from repository state.

    - **a. PR A0 — Authority engine projection shape. (Resolved 2026-04-22 — see `Resolved 2026-04-22 (ADR 0030 owner sub-decisions — 35a + 35b)` in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part A).)** Owner picked **(ii) new mapper class** (`AuthorityCommitProjectionBuilder`) consumed by `RunCommitOrchestratorFacade` — Authority engine stays pure. Plus four field-level sub-decisions resolved the same day: 35a.1 = `sibling-row` for `SystemName`; 35a.2 = `empty-with-guard` for typed `Services` + `Datastores` (populated later in new PR A0.5); 35a.3 = `empty-with-guard` for `Relationships` (deferred until PR A2 planning); 35a.4 = `yes` to the JSON allow-list + CI guard mechanism. **PR A0 drafting unblocked.**

    - **b. PR A1 — `IGoldenManifestRepository` overload return shape. (Resolved 2026-04-22 — see `Resolved 2026-04-22 (ADR 0030 owner sub-decisions — 35a + 35b)` in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part A).)** Owner expanded the original `Task` vs `Task<Guid>` framing to a third option and chose it: **`Task<Decisioning.Models.GoldenManifest>`** (return the produced Authority-shape manifest so the caller keeps idempotency-key reasoning). **PR A1 drafting unblocked.**

    - **c. PR A2 — feature-flag scope for facade target swap. (Resolved 2026-04-22 — see *Resolved 2026-04-22 (35c + 35f — ADR 0030)* in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part A); mechanical wiring follow-on.)** **(c.1) = (ii) global** `Coordinator:LegacyRunCommitPath` (`LegacyRunCommitPathOptions` in `ArchLucid.Core`). **(c.2) = (B)** long-term default **`false`**; **interim** shipped `appsettings` stays **`true`** until `RunCommitPathSelector` + `AuthorityDrivenArchitectureRunCommitOrchestrator` merge. Next small PR: register the selector, implement the authority orchestrator (idempotency + UoW persistence parity with the pipeline), flip default to `false`, and update test hosts.

    - **d. PR A4 — `dbo.GoldenManifestVersions` table drop — backfill / archival policy. (Resolved 2026-04-22 — see *Resolved 2026-04-22 (assessment owner Q&A — 16 decisions)* → **ADR 0030 sub-decisions (items 35d / 35e)** and [ADR 0030](architecture/adrs/0030-coordinator-authority-pipeline-unification.md) § Component breakdown / PR A4 + § Owner sub-decisions row **35d**).** Owner chose **(i) hard drop** — no historical Coordinator-shape rows preserved; backfill / archival branch removed from ADR 0030. Merge-time gate is no-rollback sign-off only.

    - **e. Phase 3 PR B placeholder tracker (`docs/architecture/PHASE_3_PR_B_TODO.md`). (Resolved 2026-04-22 — see *Resolved 2026-04-22 (assessment owner Q&A — 16 decisions)* → **ADR 0030 sub-decisions (items 35d / 35e)** row **35e**, [ADR 0029](architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md) § Lifecycle § **PR B — audit-constant retirement checklist**.)** Owner chose **both**: authoritative inline checklist on ADR 0029 plus a standalone working-surface file; **PR B merge 2026-05-05** retired the file and `scripts/ci/assert_pr_b_tracker_in_sync.py` after checklist closure.

    - **f. PR A0.5 — typed-services source for `ManifestService.ServiceType` / `RuntimePlatform`. (Resolved 2026-04-22 — see *Resolved 2026-04-22 (35c + 35f — ADR 0030)* in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part A).)** **(i) graph `Properties` metadata** — `GraphNode.Properties` keys `serviceType` and `runtimePlatform` (and `datastoreType` for storage-category nodes) hold enum names. `DefaultGoldenManifestBuilder` populates `Decisioning.Models.GoldenManifest.Services` / `Datastores` from `TopologyResource` nodes; `AuthorityCommitProjectionBuilder` maps them onto the coordinator-shaped `Contracts.Manifest.GoldenManifest`. **PR A0.5 implementation in progress in the same change set as 35c.**

---

## Surfaced by 2026-04-23 owner Q&A on assessment §4

39. **"AI Architecture Review Board" rebrand workstream — schedule.** *(Schedule sub-decision **Resolved 2026-04-23 sixth pass — Q6 / Q7** in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part B) — V1 schedule confirmed, replacement string `AI Architecture Review Board` confirmed. Brand-neutral content seam + `/why` flip + WARN-mode CI guard **shipped** 2026-04-23 as PR-1 of the rebrand workstream — see [`docs/architecture/REBRAND_WORKSTREAM_2026_04_23.md`](architecture/REBRAND_WORKSTREAM_2026_04_23.md) for the seven-PR sequence.)* Assessment §4 cross-cutting q11 was resolved 2026-04-23 as "open to repositioning" toward "AI Architecture Review Board"; Q6 / Q7 then scheduled the workstream to V1 and named the replacement string. The rebrand is a **multi-doc + multi-route** change (marketing site `/why`, `/pricing`, `/get-started`; sponsor brief; competitive landscape; per-vertical briefs; Trust Center; in-product copy on the operator-shell governance pages). **Owner-only follow-on:** any final brand approval and any trademark / domain check before PR-7 (the closing PR that flips the CI guard from WARN to FAIL) merges. Assistant continues PR-2..PR-6 in separate sessions per the workstream tracker.

---

## Surfaced by 2026-04-23 SaaS-framing reconciliation

These came out of the 2026-04-23 owner clarification — *"the user will never have to install Docker or SQL because this is a SaaS product"* — applied against the latest assessment ([`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) §0.1) and the canonical entry doc ([`START_HERE.md`](START_HERE.md) "Audience split").

36. **Buyer-facing first-30-minutes doc — copy approval.** *(Resolved 2026-04-23 sixth pass for the wiring; **owner-blocked only on Q3 screenshot capture** — see "Resolved 2026-04-23 (sixth pass — fresh independent assessment §10 owner Q&A — 17 decisions)" Q1–Q5 in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part B) and the 2026-04-23 entry "Buyer-facing first-30-minutes path: repo stub + marketing /get-started route" in `docs/CHANGELOG.md`.)* Both surfaces now ship: [`docs/BUYER_FIRST_30_MINUTES.md`](BUYER_FIRST_30_MINUTES.md) (consultative voice per Q1, q35 placeholders per Q4) and the marketing route at [`archlucid-ui/src/app/(marketing)/get-started/page.tsx`](../archlucid-ui/src/app/%28marketing%29/get-started/page.tsx) (placeholder image slots per Q3, no "talk to a human" CTA per Q5, vertical-picker labels mirror the `templates/briefs/` folder slugs per Q2 via `get-started-verticals.ts`). Merge-blocking CI guard `scripts/ci/assert_buyer_first_30_minutes_in_sync.py` enforces picker-vs-folder sync and the q35-or-allow-list rule on every prose paragraph in the buyer files. **Still owner-blocked (Q3 follow-on, not a deferred decision):** real anonymized-tenant screenshots — owner picks `tenantId` and `runId`, capture replaces the five `step-{n}-placeholder.png` slots in a follow-on PR. **Q2 wording note:** the owner answer enumerates `manufacturing` rather than the on-disk `retail` and `saas`; the picker ships the actual six on-disk slugs and the discrepancy is flagged for the owner's next pass on Q2 (this assistant treated the on-disk folders as the firmer source of truth because the CI guard checks against them).

40. **First-tenant funnel — per-tenant emission consent (owner-only).** *(Surfaced 2026-04-24 as part of Improvement 12 — first-tenant onboarding telemetry funnel — see the 2026-04-24 entry in [`docs/CHANGELOG.md`](CHANGELOG.md).)* The funnel ships in **aggregated-only** mode by default: the counter `archlucid_first_tenant_funnel_events_total` is emitted with the `event` label only — no `tenant_id`, no `userId`, no IP. The owner-only feature flag `Telemetry:FirstTenantFunnel:PerTenantEmission` (bound to `FirstTenantFunnelOptions`, default `false`) gates two privacy-sensitive behaviours: (a) adding the `tenant_id` tag to the App Insights metric, and (b) inserting per-tenant rows into `dbo.FirstTenantFunnelEvents`. The processing activity is recorded in [`docs/security/PRIVACY_NOTE.md`](security/PRIVACY_NOTE.md) §3.A under GDPR Art. 6(1)(f) (legitimate interest). **`(ii) Owner direction (2026-05-03):`** ~~Defer `dbo.FirstTenantFunnelEvents` retention, purge, and aggregate semantics to **V1.1**.~~ **Superseded 2026-05-06 (item 40 — funnel retention):** **90-day retention** with **archival to Azure Blob Storage** (cool/archive tier) after that window — uniform across all tenants regardless of paid/unpaid status. Raw rows are moved to blob (not hard-deleted) so the archive can satisfy a GDPR DSAR on-request; no automated erasure job is required for V1. **V1** implements **no** automatic deletion of these SQL rows and **no** prune job. **`(i)(iii)(iv) Resolved 2026-05-03 (owner):`** **(i)** Legitimate-interest / balancing framing in **`PRIVACY_NOTE.md`** §3.A agreed for **future** gated per-tenant emission. **(iii)** Use **notice-only** posture (no separate mandatory tenant-admin **opt-in** gate before `tenantId`-tagged metrics / funnel SQL rows)—document in Trust Center/DPA narratives when the flag is flipped. **(iv)** **`60%`** first-finding-within-thirty-minute **dashboard target** is **approved until pilot data warrants revision** (`infra/modules/first-tenant-funnel-dashboard/variables.tf`). **Operational:** default stays **`false`** until you consciously set **`Telemetry:FirstTenantFunnel:PerTenantEmission = true`** per host (staging/prod)—prerequisites are documented; flipping is not automatic. **Retention detail (2026-05-06):** retention window = **90 days**; post-window action = **archive to Azure Blob Storage** (cool/archive tier, JSON lines per batch); GDPR DSARs handled on-demand from blob archive; no automated erasure in V1.

37. **In-product support-bundle download.** *(Parts (a) + (b) **Shipped 2026-04-24** per decisions F + G in [`docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md`](archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) (Part B) — see the 2026-04-24 entry "In-product opt-in tour + `/admin/support` support-bundle download UI" in [`docs/CHANGELOG.md`](CHANGELOG.md). **Part (c) Resolved 2026-05-03 (owner)** — **`A`:** adopt the **documented shipped defaults** plus **minimal additional rule for third-party forwarding** — bearer tokens / `X-Api-Key` / password-shaped pairs redacted **at assembly**; secret-shaped env vars show **`(set)`/`(not set)` only**; keep config snapshot + run summaries + bounded audit tails as assembled today — **tenant-identifying or contact PII MUST NOT cross to external support/recipients unless** the downloader holds **`ExecuteAuthority`** and **explicitly chooses** to attach that detail (manual review mandatory every time).* UI: `/admin/support` (`ExecuteAuthority`; `POST /v1/admin/support-bundle`). Assembler: `ArchLucid.Application/Support/SupportBundleAssembler.cs`; redaction seam: `SupportBundleSensitivePatternRedactor`.

---

## Quality-assessment cadence (Resolved 2026-04-21)

- **Cadence:** **Weekly.** Each pass produces a `QUALITY_ASSESSMENT_<date>_INDEPENDENT_<score>.md` plus a paired `CURSOR_PROMPTS_<...>.md` and updates this file.
- **Next pass:** **2026-04-28.**
- **Trigger to break cadence:** any of these "score-moving" owner events — first PLG row `Published`, Marketplace listing live, or **V1.1 backlog** third-party pen-test summary published (when **TB-136** completes) — when one lands, run an unscheduled pass within 48 hours so the score reflects the new artefact. **V1** does **not** require a third-party pen-test summary for scoring; owner-conducted V1 testing does **not** trigger this bullet by itself.
- **Documentation layout (Resolved 2026-04-23):** Buyer-facing canonical entry is **[`docs/START_HERE.md`](START_HERE.md)**. CI caps markdown files directly under `docs/` (see `scripts/ci/assert_docs_root_size.py`). Most former root reference pages moved to **[`docs/library/`](library/)** with markdown links rewritten; superseded Cursor/quality packs (except the latest **68.60** pair at repo root) live under **[`docs/archive/quality/2026-04-23-doc-depth-reorg/`](archive/quality/2026-04-23-doc-depth-reorg/)**. Doc orientation: **[`docs/library/REPO_DIGEST.md`](library/REPO_DIGEST.md)**; on-demand full `docs/**/*.md` table (excluding `docs/archive/`): `python scripts/generate_doc_inventory.py`.

---

## Resolved 2026-05-29 (Azure AI Search — production-like requirement)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Scope** | **Azure AI Search is required for all production-like profiles** — Staging, Production, `archlucid config lint --profile production-like-hosted-pilot`, and sponsor handoff evidence. **Not** limited to optional reranking (`Retrieval:Reranking:Provider`) or a hypothetical `Retrieval:Provider` switch. | [`CONFIGURATION_REFERENCE.md`](library/CONFIGURATION_REFERENCE.md), proof-gate **G3** in [`GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md), TB-071, TB-096, assessment improvement #1 |
| **Config contract** | **`Retrieval:VectorIndex`** must be **`AzureSearch`** (not **`InMemory`**). **`Retrieval:AzureSearch:Endpoint`** (and index/credential material per [`AzureSearchOptions`](../../ArchLucid.Retrieval/Indexing/AzureSearchOptions.cs)) must be set so **`AzureSearchSdkClient`** registers — not **`NotConfiguredAzureSearchClient`**. Tenant OData filter on every search/delete remains mandatory (TB-071). | `appsettings.Staging.json` / `appsettings.Production.json`, [`ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`](../../ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs) |
| **Dev / test exception** | **Development** and explicit CI/test hosts may keep **`Retrieval:VectorIndex=InMemory`** for ergonomics. | Local dev, unit/integration tests |

---

## Resolved 2026-05-29 (API key scope binding — no legacy pilots)

| Sub-decision | Decision | Affects |
|---|---|---|
| **Legacy pilot posture** | **No** existing pilots rely on **header-only** tenant selection (`x-tenant-id` / scope headers without API-key or token claims). | TB-072, assessment improvement #2 |
| **TB-072 implementation** | Enforce scope-to-identity binding at API ingress **without** a grandfather carve-out for “legacy” ApiKey pilots. Document breaking-change posture only for **future** misconfigured clients. | `ArchLucid.Api` ingress, [`CUSTOMER_TRUST_AND_ACCESS.md`](library/CUSTOMER_TRUST_AND_ACCESS.md) |

---

## Related

| Doc | Use |
|-----|-----|
| [`docs/library/REPO_DIGEST.md`](library/REPO_DIGEST.md) | Project inventory and doc anchors (regenerate: `python scripts/repo_digest/build_repo_digest.py`) |
| `python scripts/generate_doc_inventory.py` | On-demand markdown table of every `docs/**/*.md` (excluding `docs/archive/`) |
| [`docs/archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) | **Latest** weighted independent assessment (68.60%) |
| [`docs/archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md`](archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_68_60.md) | Eight paste-ready Cursor prompts for the 68.60% assessment |
| [`docs/archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_67_61.md`](archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_67_61.md) | Prior 2026-04-21 assessment (67.61%) — **archived** |
| [`docs/archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md`](archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md) | Eight paste-ready Cursor prompts for the 67.61% assessment — **archived** |
| [`docs/archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_64_14.md`](archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_64_14.md) | Earlier 2026-04-21 assessment (64.14%) — **archived** |
| [`docs/archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md`](archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md) | Six paste-ready Cursor prompts; #3 and #4 stop at owner gates — **archived** |
| [`docs/archive/quality/QUALITY_ASSESSMENT_2026_04_20_INDEPENDENT_64_60.md`](archive/quality/QUALITY_ASSESSMENT_2026_04_20_INDEPENDENT_64_60.md) | Prior assessment + §8 prompts |
| [`docs/go-to-market/PRICING_PHILOSOPHY.md`](go-to-market/PRICING_PHILOSOPHY.md) § 5.4 | Reference-customer CI guard and discount re-rate |
