> **Scope:** Single onboarding hub — buyer, contributor, and security routing.
> **Spine:** This file is the **repo entry hub**; deep task lookup after your first review lives in [`architecture/README.md`](architecture/README.md).

# Start here — ArchLucid

Use this page to pick **one** door based on your role.

> **Canonical first-pilot checklist (operators):** [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) — start here for READY/WARN/HOLD steps. **Production-like preflight:** [`runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md). **Time-boxed evaluators:** [`runbooks/FIRST_VALUE_20_MINUTES.md`](runbooks/FIRST_VALUE_20_MINUTES.md). [`CORE_PILOT.md`](CORE_PILOT.md) is the four-step narrative only.

```text
START_HERE.md (you are here)
│
├─ Buyer / evaluator — no Docker / SQL / .NET install
│   ├─ https://archlucid.net
│   ├─ CORE_PILOT.md                               (**four-step narrative — read second**)
│   ├─ runbooks/FIRST_PILOT_OPERATOR_PATH.md     (single V1 pilot path — **start here for operators**)
│   ├─ runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md (production-like sponsor handoff preflight)
│   ├─ runbooks/FIRST_PILOT_TROUBLESHOOTING.md   (symptom decision tree — when stuck)
│   ├─ go-to-market/demo-proof-packets/README.md  (static demo proof shape — before setup)
│   ├─ go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md  (Pilot vs Operate — one screen)
│   ├─ go-to-market/DIFFERENTIATION_PROOF_PACKET.md  (why not generic AI — evidence-linked)
│   ├─ go-to-market/EXECUTIVE_SPONSOR_BRIEF.md  (sponsor story — after first commit)
│   ├─ library/walkthroughs/README.md            (accelerator pack index — optional depth, after first commit)
│   ├─ onboarding/EVALUATOR_WORKBOOK.md        (**compact evaluator path** — references operator checklist)
│   ├─ onboarding/EVALUATION_GUIDE.md     (**depth** — same steps; do not use as a second checklist)
│   ├─ runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md   (post-commit evidence folder)
│   ├─ runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md  (printable evidence checklist)
│   ├─ runbooks/PILOT_RESCUE_PLAYBOOK.md  (stuck mid-pilot — quick matrix)
│   └─ library/PILOT_ROI_MODEL.md         (optional depth)
│
├─ Contributor / developer — local toolchain and repo orientation
│   ├─ onboarding/day-one-developer.md         (canonical developer onboarding)
│   ├─ onboarding/day-one-sre.md               (canonical SRE onboarding)
│   ├─ onboarding/EVALUATION_GUIDE.md          (first pilot / operator motion)
│   ├─ architecture/README.md                  (poster + ownership; map after first **review**)
│   ├─ PENDING_QUESTIONS.md                    (owner decisions + gates)
│   ├─ library/CONTRIBUTOR_CODE_MAP.md         (1-page decision tree for where to change code)
│   ├─ library/CHANGE_IMPACT_CHECKLIST.md      (PR follow-through by change type)
│   ├─ library/CHANGE_IMPACT_SUMMARY_TEMPLATE.md (short buyer/operator delta template)
│   ├─ library/OPENAPI_CLIENT_DRIFT_OPERATOR_NOTE.md (integrator + contributor contract hygiene)
│   ├─ library/CUSTOM_AGENT_HANDLER_GUIDE.md   (register custom agent handlers in Host.Composition)
│   └─ library/GLOSSARY.md                     (canonical product / governance vocabulary)
│
└─ Security / GRC — trust pack (hosted UI /trust mirrors narrative)
    ├─ onboarding/day-one-security.md          (canonical security onboarding)
    └─ go-to-market/trust-center.md
```

**Deep lookup (tasks, not personas):** [`architecture/README.md`](architecture/README.md).

**Do not read yet (depth / recovery only until first commit):** [`onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md) · [`architecture/README.md`](architecture/README.md) · [`library/LIVE_E2E_HAPPY_PATH.md`](library/LIVE_E2E_HAPPY_PATH.md) · [`library/operator-shell.md`](library/operator-shell.md) · V1.1 connector catalog · Operate governance depth.

**After first commit:** [`library/REPEAT_REVIEW_LOOP.md`](library/REPEAT_REVIEW_LOOP.md) · [`go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md).

**Core Pilot — first session:** create architecture review → execute → finalize/commit → open review package. Use [CORE_PILOT.md](CORE_PILOT.md#first-session-checklist) for the short narrative and [FIRST_PILOT_OPERATOR_PATH.md](runbooks/FIRST_PILOT_OPERATOR_PATH.md) for the operational checklist. Treat `runId` as tracking metadata; the buyer-facing object is the **architecture review**.

**Writing and terminology:** [`library/CONCEPT_VOCABULARY.md`](library/CONCEPT_VOCABULARY.md) (canonical vs rejected phrasing) · [`library/GLOSSARY.md`](library/GLOSSARY.md) (definitions and record taxonomies) · [`library/PRODUCT_DOCUMENTATION_PRESENTATION.md`](library/PRODUCT_DOCUMENTATION_PRESENTATION.md) (in-app help vs GitHub — V1 product rule).
