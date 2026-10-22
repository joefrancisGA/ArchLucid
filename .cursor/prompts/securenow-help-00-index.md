<!-- SecureNow help job-match Composer prompts — paste one prompt per session.
     Origin: 2026-09-10 owner ask: review all SecureNow help pages and where they
     do not match the page they are on, create a prompt to correct each.
     Do not implement from this index. -->

# SecureNow help job-match — Composer prompt set (SH-01–SH-26)

**SN-04** rewrote **brand tokens** (ArchLucid → SecureNow) in Security help. It did **not** make Category-1 drawers or `/help/{slug}` **job-match** the SecureNow pages they sit on. Most Security-shell pages still inherit Architecture review / Approval copy.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-help-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/SECURENOW_HELP_PAGE_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_HELP_PAGE_COMPOSER_PROMPTS.md).

## Shared root cause (read before every prompt)

1. **`/governance` prefix steal.** `GOVERNANCE_APPROVAL_CONTEXTUAL_HELP_ROWS` uses prefix `/governance`. Longest-prefix matching then serves **Approval** drawer copy (approval queue, reviews, setup) to every `/governance/*` child that lacks a longer row. SecureNow spine pages hit this: remediation factory, remediation patterns, audit evidence lineage, and most infrastructure workbenches.
2. **Learn more maps to the wrong article.** `page-help-topic-map.ts` has no product-line switch. Home `/` Learn more is `first-architecture-review`. `/governance` Learn more is `governance-approval`. `/governance/infrastructure` Learn more is `cloud-connections` (so terraform, diagrams, resources, Ask, and remediation inherit connector help). Extract-upload Learn more is `evidence-intake`.
3. **Help articles still narrate architecture reviews.** Hub *summaries* for a few featured slugs were Security-rewritten (`help-center-catalog-security.ts`). Article bodies, Category-1 drawers on `/help/{slug}`, and Help search “Start here” still teach first architecture review, Architect role, AWS/GCP, Slack, and billing settings that the Security shell does not show.
4. **`localizePageContextualHelpEntry` only rewrites brand tokens.** It cannot fix a job mismatch.

Architecture (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=architecture`, typically :3000) **must keep** the current review/approval help. Do not delete Architecture copy. Add Security-aware rows or a product-line branch in the resolver.

## Diagnosis → prompt

| # | Help page / operator page | Prompt | Mismatch |
|---|----------------------------|--------|----------|
| 1 | Home `/` drawer + Learn more | **SH-01** | Architecture identities / first-architecture-review vs Security/Compliance/Infrastructure dests |
| 2 | `/help/getting-started` | **SH-02** | First-review pipeline; CTAs to `/architecture/reviews/new` |
| 3 | `/help/findings` + `/governance/findings` | **SH-03** | Architecture concerns from reviews vs ARC-AMPE cloud-evidence findings |
| 4 | `/governance/findings/assigned-to-me` | **SH-04** | Inherits findings/review copy; page is personal assigned queue |
| 5 | `/help/policy-packs` + `/governance/policy-packs` | **SH-05** | Apply packs to architecture reviews vs assign ARC-AMPE pack |
| 6 | `/help/standards-and-rules` + hub | **SH-06** | Rules “applied to a review” vs effective workspace ARC-AMPE rules |
| 7 | `/governance/remediation-factory` | **SH-07** | Approval drawer + governance-approval Learn more |
| 8 | `/governance/remediation-patterns` | **SH-08** | Same prefix steal; page is pattern registry + SoD approval |
| 9 | `/governance/audit-evidence` | **SH-09** | Approval drawer vs control lineage lookup |
| 10 | `/governance/infrastructure` | **SH-10** | Approval drawer + cloud-connections Learn more vs workbench hub |
| 11 | `/governance/infrastructure/resources` | **SH-11** | Same steal; resource explorer + evidence hubs |
| 12 | `/governance/infrastructure/terraform` | **SH-12** | Same steal; advisory Terraform mapping |
| 13 | `/governance/infrastructure/diagrams` | **SH-13** | Same steal; inventory diagrams |
| 14 | `/governance/infrastructure/diagram-reconcile` | **SH-14** | Same steal; diagram ↔ inventory correspondence |
| 15 | `/governance/infrastructure/ask` | **SH-15** | Same steal; grounded Ask with citations |
| 16 | `/governance/infrastructure/remediation` | **SH-16** | Same steal; instance/wave workbench (not factory metrics) |
| 17 | `/governance/infrastructure/extract-upload` | **SH-17** | “Start a review” + evidence-intake Learn more |
| 18 | Cloud connections hub + `/help/cloud-connections` | **SH-18** | AWS/GCP + evidence-only reviews; nav is Azure-only |
| 19 | `/help/users-and-roles` + users admin | **SH-19** | Review participation, Architect, billing; invite-reviewer |
| 20 | `/help/billing-and-plans` | **SH-20** | Featured in Security hub; billing settings are Architecture-only |
| 21 | `/help/data-handling` | **SH-21** | Architecture brief / sealed review data flow |
| 22 | `/help/integration-readiness` | **SH-22** | Slack/webhooks first; “not a gate before architecture reviews” |
| 23 | `/help/enterprise-onboarding` | **SH-23** | First architecture review checklist step |
| 24 | `/help/troubleshooting` | **SH-24** | Unblock reviews / architect workflows |
| 25 | Help hub + Help search catalog | **SH-25** | Start here / Review work still first-review; empty hint |
| 26 | `/governance/infrastructure/drift` | **SH-26** | Generic “cloud account”; Security is Azure-only |

## Pages that already match (no prompt)

Do **not** open Composer sessions for these unless a later owner review finds a new miss:

- Azure connector wizard (`/integrations/cloud-connections/azure` + `/help/cloud-connections/azure`) — job matches; brand via SN-02
- Jira, ServiceNow, Teams integration pages and their `/help/*-integration` articles (job matches; Slack/webhooks stay Architecture-only in nav)
- Connection status, system health, workspace settings, notifications, SSO/identity-provider admin
- Authentication and sign-in
- Security and trust, subprocessors, DPA template, SOC 2 self-assessment, CAIQ (company/legal; SN-06)
- Contact support, report a problem
- Preferences (cloud platform scope already Azure-forced)

## Run order

**SH-01** first if you need a product-line branch in `contextualHelpForPathname` / `pageHelpTopicForPathname` — later SH prompts reuse that switch. **SH-07–SH-16** can run in parallel after the resolver can select Security rows without the `/governance` steal. **SH-02**, **SH-03**, **SH-05**, **SH-18**, **SH-25** can parallel after **SH-01**. **SH-20** can run anytime (hub/search exclusion). **SH-26** last (small copy).

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SH-01** | First (resolver pattern) | SN-01 display name; do not wait on SN-04 |
| **SH-02–SH-06**, **SH-18–SH-25** | After 01 | Product-line help copy helpers |
| **SH-07–SH-17**, **SH-26** | After 01; parallel with each other | Longer prefixes so `/governance` no longer wins |
| **SH-25** | After 02–06, 18–24 if those slugs change titles | Catalog/search must not re-feature Architecture process topics |

## Product vs company (every prompt)

- **SecureNow** = Security *product* name in the Security shell.
- **ArchLucid** = Architecture product + legal/company (privacy, DPA, subprocessors, `*@archlucid.net`).
- Preferred mixed phrase: **“SecureNow, from ArchLucid.”**
- Code identifiers stay `ArchLucid`. Env stays `ARCHLUCID_*` / `NEXT_PUBLIC_ARCHLUCID_PRODUCT`.

## Global constraints (every prompt)

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files (Linux Cloud: `pwsh` from `$HOME/.local/bin`).
- Commit only on the named feature branch.
- **Do not** `sed`/`replace_all` the whole repo for ArchLucid → SecureNow.
- **Do not** change Architecture-process help bodies for the Architecture shell.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** add a second Next.js app or .NET host.
- **Do not** imply CPA SOC 2 or a published third-party pen test.
- UI: Carbon density, sentence case, **TB-2005**, **TB-645**. One component per file. No `ConfigureAwait(false)` in tests.
- Help links stay in-app `/help/{slug}`, not GitHub blob URLs.
- Category-1 fields: what is this page / what to do next / why empty / where to configure. Optional `{ label, href }` actions. No raw `/api/` paths, no `TB-` labels in buyer copy.
- Open full help page must job-match the route (or omit Learn more). Do not send operators to Getting started / first-architecture-review from a secondary hub.
- Verification: focused Vitest on contextual-help rows, `page-help-topic-map`, and the help article under test. Architecture :3000 must still say ArchLucid and still teach architecture review.
- Stage only files the prompt names.

## After each prompt

Summarize: files changed, tests run, Security drawer + Learn more now match the live page, Architecture unchanged, residual Architecture-process strings still reachable in the Security shell (if any).
