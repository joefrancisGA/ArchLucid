> **Scope:** Single onboarding hub — buyer, contributor, and security routing.
> **Spine:** This file is the **repo entry hub**; deep task lookup after your first review lives in [`architecture/README.md`](architecture/README.md).

# Start here — ArchLucid

Use this page to pick **one** door based on your role.

> **Canonical first-pilot checklist (operators):** [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) — start here for READY/WARN/HOLD steps. [`CORE_PILOT.md`](CORE_PILOT.md) is the four-step narrative only. [`onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md) is depth, not a second checklist. Machine-readable router index: [`library/V1_NAVIGATION_INDEX.json`](library/V1_NAVIGATION_INDEX.json).

```text
START_HERE.md (you are here)
│
├─ Buyer / evaluator — no Docker / SQL / .NET install
│   ├─ https://archlucid.net
│   ├─ CORE_PILOT.md                               (**four-step narrative — read second**)
│   ├─ runbooks/FIRST_PILOT_OPERATOR_PATH.md     (single V1 pilot path — **start here for operators**)
│   ├─ runbooks/FIRST_PILOT_TROUBLESHOOTING.md   (symptom decision tree — when stuck)
│   ├─ go-to-market/EXECUTIVE_SPONSOR_BRIEF.md  (sponsor story — after first commit)
│   ├─ library/walkthroughs/README.md            (accelerator pack index — optional depth, after first commit)
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

**Core Pilot — first session:** create architecture review → execute → finalize/commit → open review package. Use [CORE_PILOT.md](CORE_PILOT.md#first-session-checklist) for the short narrative and [FIRST_PILOT_OPERATOR_PATH.md](runbooks/FIRST_PILOT_OPERATOR_PATH.md) for the operational checklist. Treat `runId` as tracking metadata; the buyer-facing object is the **architecture review**.

**Writing and terminology:** [`library/CONCEPT_VOCABULARY.md`](library/CONCEPT_VOCABULARY.md) (canonical vs rejected phrasing) · [`library/GLOSSARY.md`](library/GLOSSARY.md) (definitions and record taxonomies).
