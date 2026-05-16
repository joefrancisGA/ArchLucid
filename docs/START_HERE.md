> **Scope:** Single onboarding hub — buyer, contributor, and security routing; deeper spine table and narrative in [`library/START_HERE_DEPTH.md`](library/START_HERE_DEPTH.md).

# Start here — ArchLucid

Use this page to pick **one** door. **[`CONTRIBUTOR_ON_ONE_PAGE.md`](CONTRIBUTOR_ON_ONE_PAGE.md)** remains a shortcut table for engineers who already know they only need install + verify commands.

```text
Five-doc evaluator spine (read in order — everything else is lookup):
1. START_HERE.md (this page)
2. CORE_PILOT.md
3. EXECUTIVE_SPONSOR_BRIEF.md
4. runbooks/PILOT_RESCUE_PLAYBOOK.md
5. library/PILOT_ROI_MODEL.md (optional metrics only after you have a committed review)
```

Deep reference lives in [`library/START_HERE_DEPTH.md`](library/START_HERE_DEPTH.md) and [`NAVIGATOR.md`](NAVIGATOR.md); do not start there on day one. **`library/DOCUMENTATION_BY_AUDIENCE.md`** maps which parts of **`docs/`** skew customer-evaluator versus contributor/vendor-internal (reduces cross-traffic fatigue).

```text
START_HERE.md (you are here)
│
├─ Buyer / evaluator — no Docker / SQL / .NET install
│   ├─ https://archlucid.net
│   ├─ EXECUTIVE_SPONSOR_BRIEF.md   (sponsor story)
│   ├─ CORE_PILOT.md               (guided architecture review / review package in product)
│   ├─ runbooks/PILOT_RESCUE_PLAYBOOK.md  (stuck mid-pilot — symptom index)
│   └─ library/PILOT_ROI_MODEL.md  (optional depth)
│
├─ Contributor / developer — local toolchain and repo orientation
│   ├─ engineering/INSTALL_ORDER.md            (canonical body)
│   ├─ engineering/FIRST_30_MINUTES.md         (canonical body)
│   ├─ CORE_PILOT.md                           (first pilot / operator motion)
│   ├─ ARCHITECTURE_ON_ONE_PAGE.md             (poster + ownership)
│   ├─ PENDING_QUESTIONS.md                    (owner decisions + gates)
│   ├─ library/CONTRIBUTOR_CODE_MAP.md         (1-page decision tree for where to change code)
│   └─ ARCHITECTURE_INDEX.md                   (maps after first run)
│
└─ Security / GRC — trust pack (hosted UI /trust mirrors narrative)
    └─ trust-center.md
```

**Deep lookup (tasks, not personas):** [`NAVIGATOR.md`](NAVIGATOR.md).

## First session — architecture review in under 30 minutes (buyer / evaluator)

1. **Start here:** open **[CORE_PILOT.md](CORE_PILOT.md#first-session-checklist)** (no prior architecture deep-dives required).
2. **In the product:** complete the four buyer steps — **create an architecture review**, let **pipeline runs** finish, **finalize**, then **review the package** (manifest summary and findings on review detail).
3. **Proof for a sponsor:** use **[EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md)** and exports from review detail; optional metrics in **[library/PILOT_ROI_MODEL.md](library/PILOT_ROI_MODEL.md)**.
4. **Defer until later:** compare, replay, graph, and heavy governance workflows — listed as secondary in **CORE_PILOT.md** §4.

**Contributor guardrail:** buyer-first checklist copy is locked by **`archlucid-ui/src/lib/core-pilot-first-review-copy.test.ts`** (hybrid “architecture review” / “run” wording).
