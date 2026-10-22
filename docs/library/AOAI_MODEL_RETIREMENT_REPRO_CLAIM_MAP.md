> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Azure OpenAI model retirement vs reproducibility claims

**Audience:** Engineering, SRE, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1499**, 2026-08-10). GTM **M-273** / **M-274**. Pair honesty CI **TB-1500** **Done** / **M-273**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#aoai-model-retirement-repro-m-274`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#aoai-model-retirement-repro-m-274) (GTM **M-274**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-273**).

**Verdict (one line):** Committed packages and comparison **artifact / stored-source** replay stay true after Microsoft retires a model version; claims that imply **re-running Real agents on the same pin** (or live Real golden-cohort gates on that pin) become false or fail — silently if the deployment **auto-upgrades** without a deliberate baseline ritual.

---

## 1. What Microsoft actually does

Per Azure OpenAI / Foundry model lifecycle:

| Deployment upgrade policy | At retirement |
|---------------------------|---------------|
| Auto-upgrade (new default / on expiry) | Deployment keeps answering on a **different** model version |
| No auto-upgrade | Inference returns errors (e.g. **410 Gone**) |

ArchLucid typically addresses a **deployment name** in config; the underlying **model version** is Microsoft-controlled. Traces may persist `ModelDeploymentName` / `ModelVersion` for attribution — that is history, not a guarantee the pin still serves.

---

## 2. Claim survival matrix

| Claim / capability | Survives pinned-version disappearance? | Code / doc anchor |
|--------------------|----------------------------------------|-------------------|
| **Committed golden manifest + `ManifestHash`** | **Yes** | Hash over sealed content; no LLM call; Done **TB-307** |
| **Export lineage / file checksums / `/export/verify`** | **Yes** | SQL + stored manifest; ADR 0040 |
| **Comparison replay `artifact`** | **Yes** | Rehydrates stored `ComparisonRecords.PayloadJson` — `ComparisonReplayService` |
| **Comparison `regenerate` / `verify` (drift)** | **Yes** (for stored sources) | Rebuilds from persisted runs/manifests/`AgentResults` — **does not** re-call AOAI |
| **Simulator / offline golden-cohort baselines** | **Yes** | Fixtures + content fingerprints; no live pin |
| **Hasher / cohort SHA re-lock ritual** (**TB-1156** / **TB-1172**) | **Yes as process** | Intentional content/hasher change — **not** model migration substitute |
| **“Re-execute Real agents → same ManifestHash”** | **No** | New completions ≠ historical pin; auto-upgrade makes this **quietly** false |
| **Live Real-LLM golden-cohort gate on retired pin** | **No** | Hard fail (410) or **silent score drift** after auto-upgrade |
| **Fine-tuned deployment on retired base** | **No** (FT has its own retirement schedule) | Done **TB-594** / **TB-1292** promotion path still needs migration |
| **Embedding / RAG re-index “same retrieval”** | **At risk** | Separate embedding deployment retirement → retrieval drift on re-index |

---

## 3. Re-lock vs rubber stamp under model change

| Situation | Honest action |
|-----------|---------------|
| Microsoft retires pin; auto-upgrade lands | Treat as **new model cohort** — measure, document, optionally re-lock **eval** baselines with rationale; do **not** rewrite historical production `ManifestHash` |
| Nightly Real cohort goes red after upgrade | Expected until baselines/promotion gate updated — not “product broken” by itself |
| Mass SHA re-lock to silence model-driven drift without naming the upgrade | **Rubber stamp** — forbidden by **TB-1172**/**TB-1173** spirit |

---

## 4. Safe pin (buyer / PA)

> Committed architecture packages remain hash-verifiable forever relative to stored bytes. Comparison **artifact** and **stored-source regenerate/verify** detect drift in **persisted** packages without calling Azure OpenAI. **Bit-identical re-execution** of Real agents is **not** promised across Azure OpenAI model retirements or silent deployment upgrades. When a pin retires, migrate deployments deliberately and re-baseline live eval/FT gates — do not imply the old model still ran.

---

## 5. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Golden cohort proves perpetual model reproducibility” | Offline/Simulator baselines ≠ live Real pin immortality |
| “Replay always re-runs the same model” | Default replay is artifact/stored-source; LLM re-execute is a different product claim |
| “Auto-upgrade preserves ManifestHash continuity” | Auto-upgrade preserves **availability**, not **output identity** |
| “Drift detection proves the LLM didn’t change” | Verify-mode drift is vs **stored comparison payload / sealed sources**, not vs a live model oracle |

---

## 6. Related owners (orchestrate, do not reopen Done)

| ID | Role |
|----|------|
| **TB-1024** / **M-174** | Comparison immutable snapshot / real drift |
| **TB-1156**–**TB-1157** / **M-198** | Dual hasher / production re-lock CI |
| **TB-1172**–**TB-1173** / **M-201** | Cohort re-lock vs rubber stamp |
| **TB-1228** / **M-209** | Faithfulness scoring lanes (promotion vs commit) |
| **TB-1506** / **M-276** | Nightly vs live tripwire honesty |
| **TB-1292** / **M-227** | FT promotion decision record |
| **TB-688** | Per-tier model refresh cadence (**V2**) |
| Done **TB-307**, **TB-594** | Export verify; FT plumbing |

---

## 7. Engineering follow-ons (optional)

1. Ops checklist: inventory deployment upgrade policies + retirement dates; alert before pin expiry.
2. Fail closed or warn when Real execute targets a deployment whose reported model version ≠ last-known pin (if Azure exposes it).
3. Label UI/docs: “Replay (stored)” vs “Re-execute (new LLM call).”

---

## 8. Code entry points (verification)

| Concern | Primary file |
|---------|--------------|
| Comparison replay modes (`artifact` / `regenerate` / `verify`) | `ArchLucid.Application/Analysis/ComparisonReplayService.cs` |
| End-to-end stored-source regenerate | `ArchLucid.Application/Analysis/EndToEndReplayComparisonService.cs` |
| Export verify (no LLM) | `ArchLucid.Application/Analysis/RunExportLineageVerifier.cs` |
| Canonical ManifestHash | `ArchLucid.Decisioning/Services/ManifestHashService.cs` |
| Replay / drift runbook | [`RUNBOOK_REPLAY_DRIFT.md`](RUNBOOK_REPLAY_DRIFT.md) |
| Comparison snapshot contract | [`COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md`](COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md) |
