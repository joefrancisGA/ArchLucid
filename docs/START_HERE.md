> **Scope:** Single onboarding hub — buyer, contributor, and security routing.
> **Spine:** This file is the **repo entry hub**; deep task lookup after your first review lives in [`architecture/README.md`](architecture/README.md).

# Start here — ArchLucid

Use this page to pick **one** door based on your role.

**Moved or merged docs:** [`redirects.md`](redirects.md) — canonical paths when an old bookmark 404s (no redirect stub files in-tree).

## Canonical setup paths (pick one)

| Persona | Start here | After that |
| --- | --- | --- |
| **Contributor / developer** (local stack, first run) | [`engineering/FIRST_30_MINUTES.md`](engineering/FIRST_30_MINUTES.md) | Install order: [`engineering/INSTALL_ORDER.md`](engineering/INSTALL_ORDER.md) · week one: [`onboarding/day-one-developer.md`](onboarding/day-one-developer.md) |
| **Platform operator** (Azure / hosted deploy) | [`library/FIRST_AZURE_DEPLOYMENT.md`](library/FIRST_AZURE_DEPLOYMENT.md) | Stack answers: [`deploy/archlucid.stack.example.yaml`](../deploy/archlucid.stack.example.yaml) + `archlucid stack init` (**TB-654**) · deploy umbrella: [`engineering/DEPLOYMENT.md`](engineering/DEPLOYMENT.md) |
| **Enterprise customer admin** (hosted tenant; no repo clone) | [`library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`](library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md) | In-product **Settings** and `/help` mirror this checklist |

> **Buyer / evaluator (no local install):** [`CORE_PILOT.md`](CORE_PILOT.md) narrative + [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) — not the contributor table row above.

> **Role-based entry (3–4 docs per persona):** [`runbooks/ROLE_INDEX.md`](runbooks/ROLE_INDEX.md) — operator, platform engineer, and release owner sequences with failure branches.

> **V1 critical path (minimum doc set):** [`runbooks/ROLE_INDEX.md`](runbooks/ROLE_INDEX.md#v1-critical-path-mandatory-docs) — mandatory paths for buyer, operator, security reviewer, and RC signoff; excludes deferred v1.1/v2 distractions.

> **Canonical first-pilot checklist (operators):** [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) — start here for READY/WARN/HOLD steps; time-boxed evaluators use § [First value in 20 minutes](runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed). **Evaluators choosing a path:** [`runbooks/FIRST_EVALUATOR_DECISION.md`](runbooks/FIRST_EVALUATOR_DECISION.md) — three choices only (demo, real pilot, sponsor handoff). **Production-like preflight:** [`runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md). [`CORE_PILOT.md`](CORE_PILOT.md) is the four-step narrative only.

```text
START_HERE.md (you are here)
│
├─ Buyer / evaluator — no Docker / SQL / .NET install
│   ├─ https://archlucid.net
│   ├─ CORE_PILOT.md                               (**four-step narrative — read second**)
│   ├─ runbooks/FIRST_PILOT_OPERATOR_PATH.md     (single V1 pilot path — **start here for operators**)
│   ├─ runbooks/FIRST_EVALUATOR_DECISION.md      (**three first paths** — demo / real pilot / sponsor handoff)
│   ├─ runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md (production-like sponsor handoff preflight)
│   ├─ runbooks/FIRST_PILOT_TROUBLESHOOTING.md   (stuck mid-pilot — symptom tree + quick matrix)
│   ├─ library/walkthroughs/README.md#buyer-jobs-specialty-index  (specialty buyer jobs + demo proof; buyer-jobs/README alias)
│   ├─ go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md  (Pilot vs Operate + pass/hold — one screen; evaluator-workbook alias)
│   ├─ go-to-market/DIFFERENTIATION_PROOF_PACKET.md  (why not generic AI — evidence-linked)
│   ├─ go-to-market/EXECUTIVE_SPONSOR_BRIEF.md  (sponsor story — after first finalize)
│   ├─ library/walkthroughs/README.md            (accelerator pack index — optional depth, after first finalize)
│   ├─ runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md   (post-finalize evidence folder)
│   └─ library/PILOT_ROI_MODEL.md         (optional depth)
│
├─ Contributor / developer — local toolchain and repo orientation
│   ├─ engineering/FIRST_30_MINUTES.md          (**canonical first run — Docker only**)
│   ├─ engineering/INSTALL_ORDER.md             (after first run — SDK/Node install order)
│   ├─ onboarding/day-one-developer.md         (week one after install)
│   ├─ onboarding/day-one-sre.md               (canonical SRE onboarding)
│   ├─ library/FIRST_AZURE_DEPLOYMENT.md       (platform Admin — first Azure deploy)
│   ├─ go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md  (buyer pass/hold + next-step chooser)
│   ├─ architecture/README.md                  (poster + ownership; map after first **review**)
│   ├─ PENDING_QUESTIONS.md                    (owner decisions + gates)
│   ├─ library/CONTRIBUTOR_CODE_MAP.md         (where to change code + PR follow-through; CHANGE_IMPACT_CHECKLIST alias)
│   ├─ library/CHANGE_IMPACT_SUMMARY_TEMPLATE.md (short buyer/architect delta template)
│   ├─ library/OPENAPI_CONTRACT_DRIFT.md       (OpenAPI snapshot + client regenerate hygiene)
│   ├─ library/CUSTOM_AGENT_HANDLER_GUIDE.md   (register custom agent handlers in Host.Composition)
│   └─ library/GLOSSARY.md                     (canonical product / governance vocabulary)
│
└─ Security / GRC — trust pack (hosted UI /trust mirrors narrative)
    ├─ onboarding/day-one-security.md          (canonical security onboarding)
    └─ go-to-market/trust-center.md
```

**Deep lookup (tasks, not personas):** [`architecture/README.md`](architecture/README.md).

**Do not read yet (depth / recovery only until first finalize):** [`architecture/README.md`](architecture/README.md) · [`library/LIVE_E2E_HAPPY_PATH.md`](library/LIVE_E2E_HAPPY_PATH.md) · [`library/operator-shell.md`](library/operator-shell.md) · V1.1 connector catalog · Operate governance depth.

**After first finalize:** [`library/REPEAT_REVIEW_LOOP.md`](library/REPEAT_REVIEW_LOOP.md) · [`go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md).

**Core Pilot — first session:** create architecture review → execute → finalize → open architecture package. Use [CORE_PILOT.md](CORE_PILOT.md#first-session-checklist) for the short narrative and [FIRST_PILOT_OPERATOR_PATH.md](runbooks/FIRST_PILOT_OPERATOR_PATH.md) for the operational checklist. Treat `runId` as tracking metadata; the buyer-facing object is the **architecture review** (API/CLI may still say `run` / `commit`).

**Writing and terminology:** [`library/CONCEPT_VOCABULARY.md`](library/CONCEPT_VOCABULARY.md) (canonical vs rejected phrasing) · [`library/GLOSSARY.md`](library/GLOSSARY.md) (definitions and record taxonomies) · [`library/PRODUCT_DOCUMENTATION_PRESENTATION.md`](library/PRODUCT_DOCUMENTATION_PRESENTATION.md) (in-app help vs GitHub — V1 product rule).
