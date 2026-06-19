> **Scope:** Sponsor packet send/no-send hardening review — 2026-06-16 assessment follow-up.

# Sponsor packet send/no-send hardening review

**Audience:** Release owner, engineering, GTM.  
**Last reviewed:** 2026-06-16

**Purpose:** Confirm sponsor-facing artifact paths cannot be sent with missing execution mode, weak ROI basis, demo-derived data, or low support — and record remediation applied.

**Audit checklist:** [`SPONSOR_CLAIM_LABEL_AUDIT.md`](SPONSOR_CLAIM_LABEL_AUDIT.md) · [`AI_OUTPUT_DECISION_SUPPORT.md`](AI_OUTPUT_DECISION_SUPPORT.md) · [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md)

---

## Surfaces reviewed

| Surface | Execution mode | ROI gate | Demo / low support | Verdict |
| --- | --- | --- | --- | --- |
| First-value report (Markdown) | ✅ Sponsor first-page table | ✅ PASS/WARN/HOLD narrative gate | ✅ Demo tenant banner | **OK** |
| Executive review packet (Markdown) | ✅ **Added 2026-06-16** (`## Execution mode`) | ✅ ROI claim disposition section | ⚠️ Uses ROI summary flags; demo run context operator-dependent | **Fixed gap** |
| Sponsor evidence pack (API) | ⚠️ Indirect via deltas/trust surfaces | Partial — process instrumentation | Demo run id explicit in response | **OK with labels** |
| Executive ROI summary (API) | Via trust card / run detail | ✅ Disposition resolver | Heuristic fallback → HOLD | **OK** |
| Architecture Review DOCX/PDF | ✅ Provenance footer | ✅ ROI sections | Whitelabel does not strip labels | **OK** |
| Proof pipeline (`collect-first-pilot-proof.ps1`) | ✅ `realModeEvidenceStatus` | ✅ `roiSponsorSafe`, `-FailOnHold` | ✅ BLOCK rows | **OK** |
| UI command center phase | ✅ `sponsorDisposition` | ✅ Baseline gate | ✅ Deferred scope phase | **OK** |

---

## Finding (2026-06-16)

**Gap:** `ExecutiveReviewPacketComposer` exported sponsor Markdown **without** an execution-mode section, violating SPONSOR_CLAIM_LABEL_AUDIT rule 3 ("Always include execution mode on sponsor exports").

**Risk:** Executive packet forwarded while simulator output could be misread as live proof.

---

## Remediation applied

1. **Shared formatter:** `ArchLucid.Application/Pilots/SponsorExecutionModeMarkdownFormatter.cs` — reused by first-value report and executive packet.
2. **Executive packet:** `ExecutiveReviewPacketComposer` emits `## Execution mode` after manifest summary, including fallback callout when `RealModeFellBackToSimulator`.
3. **Tests:** Golden fixture + required-section test updated; cross-surface invariant coverage retained on first-value + trust card.

**Minimal remediation prompt (if regressions recur):**

```text
Ensure every sponsor Markdown export includes execution mode via SponsorExecutionModeMarkdownFormatter. Add a test in ExecutiveReviewPacketGoldenFixtureTests requiredSections. Do not weaken simulator/real-mode labels.
```

---

## Send / no-send rules (consolidated)

**SEND only when all true:**

- `sponsorPacketDisposition` ∈ {READY, WARN} and proof `-FailOnHold` passes
- Execution mode visible on **every** sponsor export path used
- ROI narrative gate ≠ HOLD when quoting dollars or % savings
- `projectedDollarClaimsSponsorSafe` = true for projected USD
- Not demo-derived outcome claims on demo tenant

**HOLD when any:**

- BLOCK row in proof pipeline
- Simulator/Fallback without labels
- ROI basis `not-collected` / `demo-derived` with dollar lead
- PilotStrict failed on real-mode host
- Missing real-mode gate while claiming full-real-mode (see [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md))

---

## Verification commands

```powershell
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ExecutiveReviewPacketGoldenFixtureTests|FullyQualifiedName~ExecutionModeCrossSurfaceInvariantTests"
Invoke-Pester -Path scripts/tests/collect-first-pilot-proof.Tests.ps1
```

---

## Related

- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
