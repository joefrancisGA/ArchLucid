> **Scope:** Contributor-reference contract for engineering and principal-architect diligence; not a buyer brochure. Does **not** reopen Done **TB-135** / **TB-136**.

# Minimum pilot trust packet without CPA SOC 2 / published third-party pen test

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** Shipped contract for **TB-1112** / GTM **M-190** / **M-191**. Honesty CI **TB-1113** / **M-190** (named anchors below — not yet implemented).

**Verdict (one line):** Stage 0 single-pilot trust is a **six-element Real SEND executive packet** plus **labeled self-attested** assurance substitutes — **not** a CPA-issued SOC 2 report and **not** a published third-party pen-test summary.

**Buyer handout:** [`../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#minimum-pilot-trust-packet-m-191`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#minimum-pilot-trust-packet-m-191) (`MINIMUM_PILOT_TRUST_PACKET_WITHOUT_CPA_PA_ONE_PAGER.md` alias).

**Assembly path (executive packet):** [`../go-to-market/QUOTE_TO_PROOF_PACKET.md#executive-paid-pilot-proof-packet-assembly--mock-procurement-review`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#executive-paid-pilot-proof-packet-assembly--mock-procurement-review).

---

## 1. Include (minimum Stage 0 bar)

| Element | Meaning | Where it lives |
|---------|---------|----------------|
| Committed package | Golden manifest + `ManifestHash` on a Real (or honestly labeled) run | **M-155** / **TB-1003**; sponsor packet assembly |
| Mode label | Execution mode visible on sponsor surfaces | **M-128** / INV-002 honesty |
| Evidence-linked findings | Findings with evidence refs / provenance story | **M-207** / **M-208** when in scope |
| Mode-labeled export | Export/verify path; no silent Simulator-as-production | Export footers + mode labels |
| Source-classified ROI | Estimates labeled; no Simulator-as-customer-savings | **M-138** / **M-139**; **TB-983**–**TB-985** |
| Self-attested assurance | Trust Center + SOC self-assessment + owner-conducted pen-style summary — **labeled as substitutes** | Trust Center; V1 **TB-005** posture; ASSURANCE_STATUS_CANONICAL |

These six Stage 0 trust elements are the **pilot trust bar**. The QUOTE_TO_PROOF_PACKET “six required elements” table is the **operator assembly recipe** for an executive sponsor handoff (ROI assumptions, freshness, cited evidence, disposition, audit timeline, remediation ticket). Both are required for a Real SEND — do not treat CPA / 3P publication as a seventh required packet file.

---

## 2. Drop / defer (not required for single-pilot Stage 0)

| Item | Why deferred | Owner home |
|------|--------------|------------|
| CPA-issued SOC 2 report | Organizational attestation program — not Stage 0 gate | **G-REAL-05** (tech **TB-135** Done / tracking closed) |
| Published third-party pen test | Vendor SoW + redacted summary — not Stage 0 gate | **G-ASSURANCE-02** (tech **TB-136** Done / tracking closed) |
| Stage 1 “evidence-backed selling” / G4 ≥3 pilot proof rows | Multi-pilot evidence — not first-pilot bar | **G-REAL-06** / **G-REAL-07**; Stage 0 allowlist **M-188** / **M-189** |
| Named public reference customer | Requires owner clearance | GTM owner |

**Mock-review PASS:** deferred `(B)` procurement realism items (absent CPA / published 3P) are **accepted as scope** when the include matrix above is complete — do not FAIL a Stage 0 mock solely for missing CPA/3P publication.

---

## 3. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Pilot trust requires a CPA-issued SOC 2 report” | Six-element Real SEND + labeled self-attested substitutes |
| “We are third-party pen tested” / “independent pen test available” | Owner-conducted pen-style summary (**TB-005**) or program deferred (**G-ASSURANCE-02**) |
| “Trust Center / SOC self-assessment = SOC 2 certified” | Honesty + evidence pointers; self-asserted only |
| “SOC 2 ready / almost / in process / in flight” | Planned / not issued; funding trigger in ASSURANCE_STATUS_CANONICAL |
| “Pen test in flight / underway / pending engagement” when only SoW/template exists | Planned, not yet scheduled — no implied awarded vendor |
| Mock FAIL because CPA / 3P missing | Mock PASS may accept deferred `(B)` as scope |

**Talk-track (do not duplicate here):** [`../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#soc2-pentest-honest-talk-track-m-197`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#soc2-pentest-honest-talk-track-m-197) · open engineering **TB-1144** / **TB-1145**.

---

## 4. Related owners (orchestrate — do not duplicate)

| ID | Role |
|----|------|
| Done **M-190** / **M-191**; **TB-1112** | This minimum pilot trust packet contract + buyer handout |
| Open **TB-1113** | Anti-CPA/3P-as-pilot-packet honesty CI |
| Done **M-188** / **M-189**; **TB-1072** cluster | Stage 0 claim allowlist vs oversell |
| Open **TB-1144** / **TB-1145**; **M-196** / **M-197** | SOC 2 / pen-test honest conversation ladder |
| Done **TB-135** / **TB-136** | Tech tracking closed — do **not** reopen |
| Open **G-REAL-05** / **G-ASSURANCE-02** | Owner CPA / 3P execution only |
| V1 **TB-005** | Owner-conducted pen-style summary (in-scope substitute, not 3P publication) |

---

## 5. CI anchors (**TB-1113**)

Honesty guard (follow-on): `scripts/ci/check_minimum_pilot_trust_packet_honesty.py` (wire in `run_buyer_surface_strict_guards.py` when **TB-1113** ships).

Intended fail stubs:

- Stage 0 / pilot-trust copy that **requires** CPA-issued SOC 2 or a **published** third-party pen test as the single-pilot bar.
- Equating Trust Center / SOC self-assessment / owner-conducted pen-style summary with “SOC 2 certified” or “third-party pen tested.”
- “SOC 2 ready/almost/in process” or “pen test in flight” hedges without ASSURANCE_STATUS_CANONICAL / this contract caveats.

Source of truth: this contract + buyer handout **M-191** + [`ASSURANCE_STATUS_CANONICAL.md`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md).
