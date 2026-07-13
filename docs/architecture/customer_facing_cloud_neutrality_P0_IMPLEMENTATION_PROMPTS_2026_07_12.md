> **Scope:** Copy-paste Composer/agent prompts implementing **P0** fixes from the cloud-neutrality assessment. Each prompt is self-contained so it can run in a fresh session with no prior chat history. Run in listed order where dependencies exist; otherwise prompts are parallel-safe.
>
> **Assessment date:** 2026-07-12  
> **Source assessment:** [`customer_facing_cloud_neutrality_assessment.md`](customer_facing_cloud_neutrality_assessment.md) — read §4–§5 (ranked findings), §10 (approved terminology), §12–§18 before starting.  
> **Backlog IDs:** **TB-767**–**TB-780** in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md).

# Customer-facing cloud neutrality — P0 implementation prompts

**Status:** Not yet run (all prompts open as of 2026-07-12).

**Parallel-safe groups:**

| Group | TB IDs | Can run together |
|-------|--------|------------------|
| A | TB-767, TB-768, TB-769, TB-770, TB-771, TB-772, TB-773, TB-774 | Yes (disjoint files) |
| B | TB-775 | After or with A (wizard tests) |
| C | TB-776 | After A (extends guards; may import new copy constants from A) |
| D | TB-777, TB-778, TB-779, TB-780 | Yes (docs + labels + search index) |

**Global rules (every prompt):**

- Copy-only unless the prompt explicitly says otherwise.
- Use approved neutral terminology from the assessment §10. Do **not** sprinkle “AWS and Google Cloud” beside every Azure reference.
- Do **not** weaken `cloud-neutral-primary-copy-guard.test.ts` banned phrases.
- Do **not** change `/integrations/itsm` redirect, backend secret providers, or embed `ItsmConnectorConnectionSection` (those are **P1** / **TB-781+**, not this cluster).
- Stage only files touched by the prompt; do not `git add -A`.
- Run scoped Vitest for touched UI files; do not run full solution build unless the prompt says so.

---

## Prompt 1 — TB-767: ITSM Jira/ServiceNow product pages — copy purge + readiness cross-link

**Findings closed:** Assessment §4 rank 2; §5 ranks 1, 7, 8; §6 (ServiceNow page); §12 item 1; §16 cross-link pattern.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §5–§6, §14–§16, and §10 (approved terminology) before starting.

Task (TB-767): Fix customer-visible copy on /integrations/jira and /integrations/servicenow
(shared component archlucid-ui/src/app/(operator)/integrations/_sections/itsm/ItsmProductIntegrationPageClient.tsx).

1. Readiness cross-link (header, ~L163–172):
   Replace the sentence that lists "Teams, Slack, Azure, and webhooks" with assessment §16 cross-link:
   "See Integration readiness for status across ServiceNow, Jira, Teams, Slack, cloud connections, and webhooks."
   Use INTEGRATIONS_READINESS_PATH for the link. Do not name Azure alone on this surface.

2. Deployment prerequisites card (~L191–234):
   REMOVE from default customer-visible UI:
   - "host configuration"
   - "Key Vault materialization"
   - "tenant SQL"
   - Any Integrations:ItsmOutbound:* configuration key strings
   - "single-tenant pilot fallback" in PRODUCT_COPY summary (jira + servicenow entries ~L48–57)
   REPLACE product summaries with assessment §16 ITSM lead pattern, e.g.:
   "Configure {vendor} outbound ticket/incident creation from architecture findings. Set connection details and routing preferences for this workspace."
   (Drop the "unified ITSM page" promise until P1 restores that route — do not link to /integrations/itsm.)

   For deployment-level native create status: either remove the entire "Deployment prerequisites" card from the default view OR collapse it behind a <details> disclosure titled "Platform operator notes" with buyer-safe text:
   "Native ticket creation may require credentials configured by your platform team. Contact your administrator if connection checks fail."
   No config keys inside disclosure.

3. Connection test card (~L319–346):
   - CardDescription: "Runs a read-only connection check for {vendor}." (not "vendor probes")
   - Smoke help link label: "{Vendor} connection verification checklist" (not "smoke checklist")
   - Keep hrefs to existing help topics unless a rename is required for label parity only.

4. Add archlucid-ui/src/app/(operator)/integrations/_sections/itsm/ItsmProductIntegrationPageClient.test.tsx (new):
   - Render jira and servicenow variants
   - Assert rendered output does NOT match /Integrations:ItsmOutbound/i
   - Assert rendered output does NOT match /host configuration|tenant SQL|Key Vault materialization/i
   - Assert readiness helper text includes "cloud connections" and does NOT match /\bAzure\b/ outside of unrelated contexts

5. Update any existing tests/snapshots that assert old strings.

Do not change API calls, probe behavior, or ItsmConnectorConnectionSection.
Run: npx vitest run src/app/(operator)/integrations/_sections/itsm/ --from archlucid-ui/

Stop and report: strings replaced, whether Deployment card removed vs disclosed, test results.
```

---

## Prompt 2 — TB-768: Marketing `/why` — buyer-safe tenant isolation row + CI alignment

**Findings closed:** Assessment §4 rank 5; §5 rank 2; §12 item 3.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §5 rank 2 and §10 before starting.

Task (TB-768): Remove implementation leakage from the public /why competitive comparison table.

1. archlucid-ui/src/lib/why-comparison.ts — replace WHY_COMPARISON_TABLE_ROW_LABELS_IN_ORDER row that contains
   "TenantDatabaseBindings" and "SQL RLS is not the production boundary" with buyer-safe text aligned to
   docs/go-to-market/COMPETITIVE_LANDSCAPE.md intent, e.g.:
   "Tenant isolation uses separate database catalogs per tenant, with application-layer scope enforcement on every request"

2. Run scripts/ci/check_why_table_alignment.py (or the repo's documented CI script for why-table alignment) and update
   docs/go-to-market/COMPETITIVE_LANDSCAPE.md first-column row if CI enforces parity.

3. Update WhyArchlucidMarketingView.test.tsx.snap and/or why-comparison tests if present:
   - Assert new label does not contain TenantDatabaseBindings, RLS, or internal type names

Do not change other comparison rows or scoring cells.

Stop and report: old vs new label text, CI script result, test results.
```

---

## Prompt 3 — TB-769: Welcome homepage — multi-cloud use-case card parity

**Findings closed:** Assessment §4 rank 1 (Critical marketing bias).

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §4 rank 1 and §11 (when Azure-specific language should remain) before starting.

Task (TB-769): Rebalance public homepage use-case cards so Azure is not 2/3 of the hero grid.

File: archlucid-ui/src/components/marketing/welcome-marketing-copy.ts — WELCOME_USE_CASE_CARDS

Current state: cards 2 and 3 are Azure WAF and Azure CAF/LZ only.

Implement ONE of these (pick the smaller diff that achieves parity):
  Option A (preferred): Keep card 1 (AI governance + security baseline) as cloud-neutral; REPLACE card 2 with
    "AWS Well-Architected Framework" themed copy; REPLACE card 3 with "Google Cloud Architecture Framework" themed copy.
    Use the same disclaimer tone as existing cards (thematic mapping, not certification).
  Option B: Replace cards 2–3 with a single "Multi-cloud architecture review" card and add one AWS + one GCP bullet inside card 1.

Update WelcomeMarketingUseCasesSection.test.tsx / WelcomeMarketingPage.test.tsx if they assert card titles.

Keep WELCOME_POLICY_PACK_DISCLAIMER unchanged.

Stop and report: which option chosen, final card titles, test results.
```

---

## Prompt 4 — TB-770: Stale customer docs — ITSM V1 GA alignment

**Findings closed:** Assessment §4 rank 11; §9 stale FAQ; §12 item 7.

```
Read docs/go-to-market/INTEGRATION_CATALOG.md § "Commitment boundary" and docs/architecture/customer_facing_cloud_neutrality_assessment.md §9 before starting.

Task (TB-770): Fix stale V1.1 ITSM claims in customer-facing docs.

1. docs/library/customer-facing/FAQ.md — "Can I connect ITSM in V1?" section (~L38–39):
   State first-party Jira, ServiceNow, Teams, and Slack are V1 GA (owner scope 2026-07-03).
   Link INTEGRATION_CATALOG.md. Note OAuth upgrades (TB-600) as tightening, not missing MVP.

2. docs/library/customer-facing/CI_CD_INTEGRATION_GUIDE.md — audience line that defers ITSM to V1.1:
   Update to reflect V1 GA first-party connectors; REST/CLI remain valid for pipeline automation.

3. If marketing-faq.ts duplicates the stale ITSM claim, align it too (grep "V1.1" + ITSM in archlucid-ui and docs/library/customer-facing).

4. Add or extend a Vitest/doc guard only if an existing pattern exists (e.g. product-documentation-registry.test.ts);
   otherwise skip new CI and note in report.

Do not change INTEGRATION_CATALOG.md (source of truth).

Stop and report: files changed, before/after FAQ excerpt.
```

---

## Prompt 5 — TB-771: Teams integration — approved secret-store wording

**Findings closed:** Assessment §5 rank 3; §12 item 4; §15 secret-storage patterns.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §15 and §10 before starting.

Task (TB-771): Neutralize Azure Key Vault as the universal customer metaphor on /integrations/teams.

Files (minimum):
- archlucid-ui/src/lib/teams-integration-page-copy.ts
- archlucid-ui/src/lib/teams-integration-secret-validation.ts
- archlucid-ui/src/app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx (labels)
- archlucid-ui/src/app/(operator)/integrations/teams/_sections/TeamsIntegrationAside.tsx if it repeats KV
- teams-integration-secret-validation.test.ts
- TeamsNotificationsIntegrationPageClient.test.tsx if present

Changes:
1. Primary customer strings use "approved secret store" / "secret name or reference" per assessment §15.
2. Add a short hosted-deployment footnote (aside or helper text):
   "On ArchLucid-hosted deployments, the supported secret store is Azure Key Vault."
   Do NOT claim AWS Secrets Manager or Google Secret Manager are supported today.

3. Replace user-visible "Key Vault secret name" labels with "Secret name" or "Secret reference".
4. Validation error "Check the workspace's Key Vault permissions" → assessment §14 secret-access failure pattern.

Update tests that assert exact old strings.

Do not change Teams API payloads or backend KV resolution.

Run: npx vitest run src/lib/teams-integration-secret-validation.test.ts src/app/(operator)/integrations/teams/ --from archlucid-ui/

Stop and report: string mapping table, test results.
```

---

## Prompt 6 — TB-772: Health + Finish setup — secrets-store neutral labels

**Findings closed:** Assessment §5 ranks 5–6; §12 items 5–6.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §10 before starting.

Task (TB-772): Rename Azure-centric health/setup labels to provider-neutral customer language.

1. archlucid-ui/src/lib/health-readiness-presentation.ts
   - READINESS_CHECK_LABELS keyvault: "Secrets store connectivity" (not "Key vault connectivity")
   - CONFIGURATION_PROBE_LABELS key_vault: "Secrets store access" (not "Key vault access")
   - SKIPPED_EXPLANATIONS keyvault: "Secrets store is not configured for this environment."
   Keep internal check ids (keyvault, key_vault) unchanged for API compatibility.

2. archlucid-ui/src/components/FinishSetupWizardPanel.tsx (~L85):
   Replace "without manual Key Vault edits" with "without manual secret-store configuration"

3. Update tests referencing visible labels:
   - health-readiness-presentation tests if any
   - FinishSetupWizardPanel consumers / snapshots

Run scoped vitest for health + finish-setup related tests.

Stop and report: label changes, test results.
```

---

## Prompt 7 — TB-773: Cloud-neutral intake and marketing placeholders

**Findings closed:** Assessment §4 rank 7; §2.1 pricing/quick-scan inventory.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §4 rank 7 before starting.

Task (TB-773): Remove Azure-as-default implication from placeholders and examples on generic intake surfaces.

Update placeholders/examples to cloud-neutral briefs (no hyperscaler named) OR rotate explicit multi-cloud examples:

1. archlucid-ui/src/lib/reviews-new-path-copy.ts — example brief placeholder
2. archlucid-ui/src/lib/guided-intake-copy.ts — example placeholder
3. archlucid-ui/src/app/(marketing)/quick-start/QuickStartClient.tsx — textarea placeholder (~L337)
4. archlucid-ui/src/components/marketing/MarketingPricingQuotePanel.tsx — "private Azure" placeholder →
   "e.g. SaaS, customer-managed, single-tenant hosted" (or similar cloud-neutral deployment model list)
5. archlucid-ui/src/app/(marketing)/quick-scan/* if it has "e.g. Azure" placeholder (grep quick-scan Azure)

Example neutral brief (acceptable pattern):
"Customer-facing retail API with private networking, managed database, cache tier, and EU data residency goals."

Update tests that assert exact old placeholder strings (architecture-sponsor-readiness.test.tsx, etc.) only if they break.

Do not change wizard cloudProvider defaults (already None).

Stop and report: per-file old → new placeholder text.
```

---

## Prompt 8 — TB-774: Marketing `/try` and `/get-started` — cloud-neutral auth framing

**Findings closed:** Assessment §4 rank 8; §2.1 get-started Entra-first.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §10 before starting.

Task (TB-774): Reduce Entra/Azure-as-default framing on frictionless marketing entry pages.

1. archlucid-ui/src/app/(marketing)/try/page.tsx
   - metadata.description and body copy: replace "no Azure setup, no Entra ID" pattern with
     "no cloud account setup, no corporate sign-in required" (or assessment-equivalent neutral phrasing)
   - Keep honest "fabricated sample data" reassurance

2. archlucid-ui/src/app/(marketing)/get-started/page.tsx
   - Where sign-in lists "Microsoft Entra ID" first, use "work identity (Microsoft, Google, or your organization's SSO provider)"
   - Do not remove Entra where describing actual supported IdPs — just avoid implying it is the only path

3. Update page-level tests if they assert old metadata strings.

Stop and report: exact string changes per file.
```

---

## Prompt 9 — TB-775: Wizard optional inventory — no Azure command when cloud target is None

**Findings closed:** Assessment §4 rank 4; §3 workflow parity; §9 stale test expectation.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §4 rank 4 and WizardStepAzureContext.tsx before starting.

Task (TB-775): Stop defaulting optional inventory packager UI to Azure when cloudProvider is "None".

File: archlucid-ui/src/components/wizard/steps/WizardStepAzureContext.tsx

1. When cloudProvider is "None" and the optional inventory collapsible is opened:
   - Do NOT show Azure Run-ArchLucidAzureExtractor.ps1 command by default
   - Show helper copy: "Select a cloud target in the identity step to see the read-only inventory script for your provider."
   - Optionally show a compact provider picker inside the collapsible that sets cloudProvider before showing CloudInventoryExtractorCommandPanel

2. When cloudProvider is Aws or Gcp, keep current behavior (existing tests).

3. Update WizardStepAzureContext.test.tsx:
   - REPLACE test "shows the Azure inventory command by default when cloud target is None"
     with assertion that Azure command is NOT shown until provider selected OR Aws/Gcp selected shows correct platform

4. Consider renaming data-testid prefixes wizard-azure-* only if a trivial alias improves clarity; not required for P0.

Run: npx vitest run src/components/wizard/steps/WizardStepAzureContext.test.tsx --from archlucid-ui/

Stop and report: UX behavior when None vs Aws/Gcp, test results.
```

---

## Prompt 10 — TB-776: Regression guards — integration copy banned phrases

**Findings closed:** Assessment §18 tests required.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §18 before starting.

Task (TB-776): Extend cloud-neutral / anti-leakage guards so P0 fixes do not regress.

1. Create archlucid-ui/src/lib/customer-integration-copy-guard.ts:
   - Export CUSTOMER_INTEGRATION_BANNED_PHRASES: host configuration, tenant SQL, Key Vault materialization,
     Integrations:Itsm, vendor probe, smoke checklist (case-insensitive substring checks)
   - Export function listCustomerIntegrationCopyViolations(surfaces: Record<string, string>)

2. Wire guard test archlucid-ui/src/lib/customer-integration-copy-guard.test.ts against:
   - teams-integration-page-copy.ts string exports
   - Any new itsm product copy constants if extracted from ItsmProductIntegrationPageClient in TB-767

3. Extend cloud-neutral-primary-copy-guard.test.ts ONLY if new shared constants were added — do not duplicate checks.

4. Optional: add a lightweight grep-based CI script under scripts/ci/ only if similar scripts exist for docs coherence;
   skip if no precedent.

Stop and report: banned phrase list, surfaces covered, test results.
```

---

## Prompt 11 — TB-777: Connector status messages + help search index scrub

**Findings closed:** Assessment §5 ranks 8–9; connector-operations-present.test.ts L82.

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §5 ranks 8–9 before starting.

Task (TB-777): Remove Integrations:* configuration keys from customer-visible connector summaries and help search excerpts.

1. archlucid-ui/src/lib/connector-operations-present.ts (or the server message source it mirrors):
   Confluence disabled summary must not contain "Integrations:ConfluencePublishing:Enabled" in user-visible text.
   Use: "Confluence publishing is disabled for this deployment."

2. archlucid-ui/src/lib/connector-operations-present.test.ts — update expected summary string.

3. help-index.generated.ts — if Integrations:ItsmOutbound appears in customer search excerpts:
   - Fix generator source OR post-process excerpts in the generator script (prefer fixing source markdown/registry excerpts)
   - Regenerate help index via the repo's documented npm script (check archlucid-ui/package.json for generate:help-index or equivalent)

4. Grep archlucid-ui/src for Integrations: in tsx copy (exclude tests/comments) and fix any remaining customer-visible hits
   found in this pass only.

Stop and report: strings fixed, whether help index was regenerated, grep residual count.
```

---

## Prompt 12 — TB-778: Sample/demo surfaces — label Azure reference architecture honestly

**Findings closed:** Assessment §4 rank 6; §2.2 sample parity (interim P0 copy mitigation).

```
Read docs/architecture/customer_facing_cloud_neutrality_assessment.md §4 rank 6 and §19 item 10 (do not fake multi-cloud samples) before starting.

Task (TB-778): Interim P0 — label Azure-skewed sample content explicitly; do NOT rewrite the entire demo dataset.

Copy-only mitigations:

1. archlucid-ui/src/lib/empty-state-presets.ts — RUNS_EMPTY / GRAPH_IDLE actions that link to claims-intake-modernization:
   Change button/label text to include "sample (Azure reference)" or equivalent honest qualifier in the CTA label only.

2. Buyer-polished graph idle (GRAPH_IDLE_BUYER) — same pattern for "Open sample evidence graph" if it uses Azure-only demo run.

3. If FrictionlessTrialLauncher or /try page mentions "sample review" without cloud context, add one clause:
   "Sample uses an Azure reference architecture with fabricated data."

Do NOT rewrite operator-static-demo.ts findings in this P0 pass.

Update affected empty-state / marketing tests.

Stop and report: CTA label changes, test results.
```

---

## Prompt 13 — TB-779: Welcome/onboarding — disclose default Azure policy pack baseline

**Findings closed:** Assessment §4 rank 3; §8 default policy packs capability asymmetry (copy-only interim).

```
Read DefaultPolicyPackCatalog.cs StandardBaselineDisplayNames and welcome-marketing-copy.ts before starting.

Task (TB-779): Copy-only transparency for Azure-default bundled packs on new tenants — NOT provisioning code changes.

1. archlucid-ui/src/components/marketing/welcome-marketing-copy.ts
   - Extend WELCOME_USE_CASE_CARDS[0] (AI governance card) OR WELCOME_POLICY_PACK_DISCLAIMER with one sentence:
     "New workspaces include cloud-neutral security and FinOps packs; Azure Well-Architected and CIS Azure packs are enabled by default until you target AWS or Google Cloud in a review."
   (Tune wording to match actual DefaultPolicyPackCatalog.StandardBaselineDisplayNames behavior.)

2. Optional: one sentence in core-pilot-help-guide-content.ts cloud connectors section if it claims perfect pack parity.

Do not change DefaultPolicyPackCatalog.cs in this P0 prompt (TB-717 already handles run-level cloud baselines).

Stop and report: exact disclaimer text added.
```

---

## Prompt 14 — TB-780: Customer workflow doc — review vocabulary over /v1/pilots API paths

**Findings closed:** Assessment §5 rank 10.

```
Read docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md and CONCEPT_VOCABULARY.md before starting.

Task (TB-780): Reduce /v1/pilots/ API path prominence in customer-facing workflow doc.

In docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md:
- Lead API references with "review" vocabulary and note API backward-compat alias where needed
- Keep accurate API paths in a collapsed "API alias" subsection or footnote, not in the primary numbered steps

Do not change OpenAPI or backend routes.

Stop and report: sections restructured, sample before/after for one persona recipe.
```

---

## Out of scope for P0 (logged for P1+ backlog)

| Finding | Recommended backlog | Why not P0 |
|---------|---------------------|------------|
| `/integrations/itsm` redirect; embed `ItsmConnectorConnectionSection` | TB-781+ | Capability + IA |
| AWS/GCP `ISecretProvider` backends | TB-782+ | Backend work |
| Full AWS/GCP sample review packages | TB-783+ | Content + seed data |
| `layer-guidance.ts` ITSM Key Vault copy | TB-784 | Lower traffic; admin-adjacent |
| `AdminItsmConnectorOnboardingWizard` deployment leakage | TB-785 | System-admin gated |

---

## Finding → TB mapping (complete)

| Assessment ref | Severity | TB ID |
|----------------|----------|-------|
| §4 rank 1 Welcome use cases | Critical | TB-769 |
| §4 rank 2 ITSM Azure sentence | Critical | TB-767 |
| §4 rank 3 Default policy packs | High | TB-779 (copy interim) |
| §4 rank 4 Wizard inventory default | High | TB-775 |
| §4 rank 5 /why leakage | High | TB-768 |
| §4 rank 6 Sample demo skew | High | TB-778 (label interim) |
| §4 rank 7 Intake placeholders | Medium | TB-773 |
| §4 rank 8 /try metadata | Medium | TB-774 |
| §4 rank 11 FAQ stale ITSM | High | TB-770 |
| §5 rank 1 ITSM config leakage | Critical | TB-767 |
| §5 rank 2 /why | Critical | TB-768 |
| §5 rank 3 Teams Key Vault | High | TB-771 |
| §5 rank 5–6 Health + finish setup | Medium | TB-772 |
| §5 rank 7–8 Probes + smoke wording | Medium | TB-767 |
| §5 rank 9 Help index | Medium | TB-777 |
| §5 rank 10 API pilots paths in docs | Low | TB-780 |
| §18 regression tests | — | TB-776 |
| §9 CI_CD guide stale | High | TB-770 |
| §2.1 pricing/quick-scan | Medium | TB-773 |

*End of P0 prompts.*
