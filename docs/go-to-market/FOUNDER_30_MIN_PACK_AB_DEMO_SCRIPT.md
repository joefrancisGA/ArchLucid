> **Scope:** Founder-led 30-minute private-beta demo spine — pack A vs pack B on the same evidence, gate outcome, audit CSV, and WK-21 honesty. Complements the 5-minute [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](POLICY_PACK_DELTA_DEMO_SCRIPT.md).

# Founder 30-minute pack A vs pack B demo script

**Audience:** Founder, sales engineer, or CS running a **controlled beta** session (2–5 named invitees).

**Outcome:** Prospect sees that **policy assignments change gate outcomes and sponsor headlines** on the **same review** — not generic chat critique.

**Honesty:** Follow [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md). Do not claim SOC 2 certified, live agents on Workspace B, or Simulator dollars as savings.

---

## Prerequisites (5 min before call)

| Item | Reference |
| --- | --- |
| Workspace A committed run with findings | [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md) |
| Pack A = AI Governance appendix | [`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md) |
| Pack B = Security baseline appendix | [`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](../library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md) |
| Automation for phases B–D (optional) | [`scripts/demo-policy-pack-delta.ps1`](../../scripts/demo-policy-pack-delta.ps1) |
| Execution mode visible | Real vs Simulator badge on run detail |

---

## Minute-by-minute spine

| Min | Beat | Do | Say (short) |
| ---: | --- | --- | --- |
| 0–3 | **Invite path** | Confirm guest landed via invite → sign-in → correct tenant | “You are in the governed operator workspace, not a marketing sandbox.” |
| 3–8 | **Same evidence** | Open committed run; show evidence refs on one finding | “This finding is tied to your package, not a pasted prompt.” |
| 8–14 | **Pack A (baseline)** | Default / AI Governance assignment; dry-run pre-commit | “At this posture the gate allows finalize.” |
| 14–20 | **Pack B (tighten)** | Switch to Security baseline or tighten `BlockCommitMinimumSeverity`; dry-run again | “Same evidence — different pack assignment — different gate outcome.” |
| 20–25 | **Sponsor headline** | Open sponsor summary; point out disposition-aware ROI (non-summing) | “Headline ROI is disposition-aware; per-system rows do not sum to it.” |
| 25–28 | **Audit proof** | Export audit CSV; one row for gate simulation / dry-run | “Security can reconstruct this without trusting my screen share.” |
| 28–30 | **WK-21** | Name one engine that is **not** pack-driven | “Packs drive assignments and gates; not every engine is pack-aware — here is what still runs.” |

---

## Recovery lines (if something breaks)

| Symptom | Founder line | Escalation |
| --- | --- | --- |
| Run stuck | “I will grab `runId` and correlation id; we have a triage card.” | [`FIRST_PILOT_TRIAGE_CARD.md`](../runbooks/FIRST_PILOT_TRIAGE_CARD.md) |
| Simulator vs Real confusion | “This session is labeled Simulator; Real proof is a separate pilot step.” | [`EXECUTION_MODE_HONESTY_ONE_PAGER.md`](EXECUTION_MODE_HONESTY_ONE_PAGER.md) |
| “This is just ChatGPT” | Repeat pack A/B gate flip + audit CSV | §10 [`LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) |

---

## After the call

- Log funnel row: invited → signed in → saw pack delta → exported audit (see [`PRIVATE_BETA_INVITEE_WELCOME_KIT.md`](PRIVATE_BETA_INVITEE_WELCOME_KIT.md)).
- If Real extractor ZIP is available, schedule **G-REAL-06** run — demo alone does not satisfy G4.
