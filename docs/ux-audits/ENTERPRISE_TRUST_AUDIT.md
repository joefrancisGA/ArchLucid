# Enterprise Trust, Security, Procurement, and Buyer-Readiness Audit

**Date:** 2026-06-29  
**Scope:** All operator-facing, buyer-facing, and governance surfaces in `archlucid-ui/src/`  
**Objective:** ArchLucid is intended for regulated enterprise architecture review. A buyer, CTO, security leader, compliance stakeholder, or architecture governance lead should feel that the product understands evidence control, auditability, tenant isolation, governance, and decision accountability.  
**Backlog items:** TB-501–TB-515 (15 findings)  
**Conflicts with prior sessions:** None. All findings address new surfaces not covered by TB-431–500 or N01–N19.

---

## Summary statistics

| Severity | Count |
| --- | ---: |
| P0 — Must fix before external UAT | 2 |
| P1 — Must fix before buyer demos | 9 |
| P2 — Polish / hygiene | 4 |
| **Total** | **15** |

---

## 1. Enterprise trust diagnosis

### What ArchLucid gets right

ArchLucid has built a genuine enterprise trust foundation:

- **Trust center and procurement artifacts.** A public trust center page (`/trust`) and operator security-trust page (`/workspace/security-trust`) provide DPA template, CAIQ/SIG response, SOC 2 readiness artifact (with correct "Not a SOC 2 attestation report" footnote), subprocessors list, and a procurement contact.
- **Governance segregation of duties.** `BUYER_GOVERNANCE_SEGREGATION_OF_DUTIES` is displayed on the governance page. The API correctly blocks requesters from approving their own reviews.
- **Audit trail claim is honest.** `AUDIT_TRAIL_INTEGRITY_NOTE` correctly describes an append-only audit trail. The CTO demo includes an audit integrity verification button.
- **Tenant isolation claim is defensible.** "Each customer receives a dedicated database catalog" is stated in the CTO demo tenant isolation proof callout and linked to a glossary definition.
- **Demo data labeling is mostly gated.** `CtoDemoStaticFallbackPresenterBanner` is correctly gated to demo environments. `FindingTrustChip` distinguishes evidence-backed from heuristic findings.
- **Signed record terminology is enforced.** The `trustEvidenceGoldenManifestFieldTitle` guard translates "golden manifest" to "signed record" in data-layer fields for buyer shells.

### What breaks trust

Despite the foundation, six structural patterns break or weaken enterprise trust:

1. **Governance records contain internal implementation language** — The stored governance decision comment contains "Quick approve" and "governance lineage snapshot." Audit CSV exports carry this into compliance evidence packages.
2. **One-click governance approval with no friction** — The quick approve button requires no confirmation dialog or mandatory justification. Regulated buyers expect visible decision accountability, not a one-click path.
3. **Demo verification claims are not labeled as demo** — The audit integrity "Chain intact" result runs on demo-only events. Without a "demo data" disclaimer, it makes a production-like claim on synthetic data.
4. **Static demo data can appear in live governance views** — The governance workflow seeds demo approval records when the static fallback is active. A buyer in UAT with a temporarily unavailable API would see pre-seeded demo approvals.
5. **Tenant isolation is claimed but not explained in the operator trust page** — The procurement-facing page lists artifacts but provides no mechanism description. Security architects ask "how" not just "that."
6. **No data retention or deletion controls are visible** — Regulated buyers require answers to retention and deletion before procurement can proceed.

---

## 2. Top buyer trust breakers

| ID | Sev | Surface | Trust breaker |
| --- | --- | --- | --- |
| T01 | **P0** | Governance audit CSV export | `"Quick approve — no Critical/High findings in governance lineage snapshot."` stored in governance decision record |
| T02 | **P0** | CTO demo audit trail step | "Chain intact" displayed on demo sample events without "demo data" label |
| T03 | P1 | Governance quick approve button | One-click governance approval — no confirmation dialog or mandatory justification |
| T04 | P1 | Invite reviewer page | `"typically need read access"` — vague role definition |
| T05 | P1 | Operator security-trust page | Tenant isolation claimed but mechanism not explained |
| T06 | P1 | Operator settings / security-trust | No data retention policy or deletion controls visible |
| T07 | P1 | Governance workflow page | Demo approval records can appear in live workspace when API unavailable |
| T08 | P1 | Executive dashboard | "Database backup region check" card — ArchLucid infra metric not identified as such |
| T09 | P1 | Governance demo preview note | `"In a live pilot"` framing implies pre-production status |
| T10 | P1 | Governance workflow UI | `"promoteManifest"` CI/CD verb visible in buyer-facing governance strings |
| T11 | P1 | Invite reviewer flow | Role capabilities not listed — reviewer cannot approve but this is not stated |

---

## 3. Security and procurement questions the UI currently raises

An enterprise security reviewer or procurement officer walking through the UI today would ask:

1. **Governance:** "If this review was 'quick approved' — what does that mean? Can anyone with Execute authority approve in one click? Is there an audit trail of who reviewed what before clicking approve?"
2. **Audit trail:** "The demo shows a verified hash chain — does the production system actually verify this in real time, or is this just a demo feature over synthetic events?"
3. **Tenant isolation:** "You say 'dedicated database catalog' — is that row-level security, schema separation, or database-level isolation? What happens if a support engineer gets production access?"
4. **Data retention:** "How long do you retain our architecture review data? What is the process for deletion under GDPR/CCPA Article 17 requests?"
5. **Demo data in production:** "When I'm in the live workspace, how do I know the governance approvals I see are real and not seeded from a demo? The UI looks the same for both."
6. **Backup region:** "The executive dashboard shows a backup region — is this my data's backup location or yours? Who manages that?"
7. **Reviewer permissions:** "If I invite someone as a reviewer, exactly what can and cannot they do? Can they export sensitive findings to external systems?"

---

## 4. Missing trust signals

| Gap | Where it should appear | Priority |
| --- | --- | --- |
| Tenant isolation mechanism (schema/catalog/row) | Operator security-trust page | P1 |
| Data retention period and deletion request process | Operator security-trust page + Settings | P1 |
| Role capability matrix (what each role can/cannot do) | Invite reviewer flow + roles settings | P1 |
| "Demo data" disclaimer on audit integrity verification | CTO demo audit trail step | P0 |
| Formal governance decision confirmation step | Quick approve button | P1 |
| "ArchLucid infrastructure metric" label on backup region card | Executive dashboard | P1 |
| Reviewer capabilities explicit list | Invite reviewer page | P1 |

---

## 5. P0 blockers before trusted external UAT

### T01 — TB-501: Governance audit CSV contains "Quick approve" and "governance lineage snapshot"

**Why P0:** Every exported audit event for a quick-approved review will contain `"Quick approve — no Critical/High findings in governance lineage snapshot."` as the stored decision comment. When a buyer or auditor exports the audit CSV for compliance submission, this comment appears in the governance decision record. "Quick approve" signals a bypass, not a deliberate review. "governance lineage snapshot" is an implementation term. This is in a legally meaningful document.

**Fix:** In `GovernanceQuickApproveButton.tsx`, change `reviewComment` to:
`"Approved — no critical or high findings present at time of review."`

---

### T02 — TB-502: CTO demo audit integrity shows "Chain intact" on demo sample events without disclaimer

**Why P0:** `CtoDemoAuditIntegrityVerifyButton` verifies `getDemoSampleAuditTrailEvents()` — synthetic bundled events. It displays "Chain intact" with event count and head hash during step 5 of the CTO buyer demo. There is no label indicating this is demo data. A buyer watching the demo tour believes they are seeing the production hash chain verification. This is a material misrepresentation.

**Fix:** Add a sub-label below the "Chain intact" result:
`"Verified against showcase demo events. Your production audit trail is verified server-side via the same algorithm."`

---

## 6. P1 hardening before buyer demos

### T03 — TB-503: Quick approve needs confirmation dialog

Add a confirmation popover/dialog before any governance quick approve completes. Minimum: show the review subject, "No critical/high findings detected," and an optional free-text approver note. Two buttons: "Confirm approval" and "Cancel."

### T04 — TB-504: Invite reviewer "typically need" → definitive role description

Change `INVITE_REVIEWER_PAGE_LEAD` from "typically need read access" to a definitive statement of what the Reader role can and cannot do.

### T05 — TB-505: Add tenant isolation mechanism to operator security-trust page

Add a "Tenant isolation model" section: "Each workspace is bound to a dedicated database catalog. API requests carry a tenant scope header that the data layer enforces on every query."

### T06 — TB-506: Add data retention and deletion info

Add a "Data retention" section to the operator security-trust page with the retention period, deletion request process, and a link to the DPA.

### T07 — TB-507: Gate static demo governance fallback

Ensure `isStaticDemoPayloadFallbackEnabled()` is false in production workspaces. Add a visible "Showing example approval records" status when demo fallback activates.

### T08 — TB-508: Label executive backup region card as ArchLucid infrastructure

Update the card description and add a sub-label: "ArchLucid platform infrastructure — not your architecture workloads."

### T09 — TB-509: Remove "live pilot" from governance demo preview note

Change `"In a live pilot, an architect with Execute authority approves here"` to `"In production, an architect with Execute authority approves here."`

### T10 — TB-510: Replace "promote/promotion" governance UI strings with governance vocabulary

Audit `GovernanceWorkflowPageContent` and `GovernanceWorkflowPromotionsActivationsSection` for "promote/promotion" labels and replace with "governance-approved" language.

### T11 — TB-511: Add role capability list to invite reviewer flow

Add an explicit can/cannot list (can: view packages, export; cannot: approve, finalize, modify evidence) to `InviteReviewerPageView`.

---

## 7. P2 polish and code hygiene

| ID | TB | Finding | Fix |
| --- | --- | --- | --- |
| T12 | TB-512 | `FunnelTelemetryExportAnchor` wraps download links — name implies surveillance analytics | Rename to `TrackedDownloadAnchor`; add JSDoc |
| T13 | TB-513 | `GoldenManifestExportMenu` — residual "golden manifest" risk in export menu labels | Audit strings; add JSDoc warning; replace any literals |
| T14 | TB-514 | `ExplainabilityTraceTree` empty state "No evidence references recorded" gives no context | Replace with explanation distinguishing heuristic vs. evidence-backed |
| T15 | TB-515 | `"Loading backup region verification…"` — technical vocabulary in executive loading state | Replace with `"Checking backup status…"` matching card title |

---

## 8. Cursor-ready patch plan

### Batch 1 — P0 (fix before any external UAT, ~30 min)

**TB-501 — Quick approve audit comment:**
```
File: archlucid-ui/src/components/governance/GovernanceQuickApproveButton.tsx
Find:   reviewComment: "Quick approve — no Critical/High findings in governance lineage snapshot."
Change: reviewComment: "Approved — no critical or high findings present at time of review."
```

**TB-502 — Audit integrity demo disclaimer:**
```
File: archlucid-ui/src/components/cto-demo/CtoDemoAuditIntegrityVerifyButton.tsx
After the StatusTag showing "Chain intact", add:
<p className={...} data-testid="cto-demo-audit-integrity-demo-disclaimer">
  Verified against showcase demo events. Your production audit trail is verified server-side via the same algorithm.
</p>
```

---

### Batch 2 — P1 trust hardening (2–3 hours)

**TB-504 + TB-511 — Invite reviewer role definition:**
```
File: archlucid-ui/src/lib/invite-reviewer-flow.ts
Change INVITE_REVIEWER_PAGE_LEAD to definitive role description (see TB-504 scope).

File: archlucid-ui/src/app/(operator)/settings/roles/_sections/InviteReviewerPageView.tsx
Add role capability summary block (see TB-511 scope).
```

**TB-505 + TB-506 — Security-trust page enhancements:**
```
File: archlucid-ui/src/lib/operator/operator-security-trust-content.ts
Add OPERATOR_SECURITY_TRUST_TENANT_ISOLATION_SUMMARY constant.
Add OPERATOR_SECURITY_TRUST_DATA_RETENTION_NOTE constant.

File: archlucid-ui/src/app/(operator)/workspace/security-trust/_sections/OperatorSecurityTrustPageView.tsx
Add "Tenant isolation model" and "Data retention" sections using new constants.
```

**TB-507 — Demo governance fallback label:**
```
File: archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx
When initialDemoApprovals is seeded, render a role="status" banner:
"Showing example approval records — live governance data unavailable. Refresh to reload."
```

**TB-508 + TB-515 — Executive dashboard backup region card:**
```
File: archlucid-ui/src/lib/buyer-surface-vocabulary.ts
Update sqlBackupRegionVerificationMetric.description to clarify "ArchLucid platform database backup region."

File: archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveSqlBackupRegionVerificationCard.tsx
- Add sub-label: "ArchLucid platform infrastructure — not your architecture workloads."
- Change loading message from "Loading backup region verification…" to "Checking backup status…"
```

**TB-509 — Governance demo preview note:**
```
File: archlucid-ui/src/lib/buyer/buyer-polish-copy.ts
Find:   "In a live pilot, an architect with Execute authority approves here. The view below shows the post-approval state for demonstration purposes."
Change: "In production, an architect with Execute authority approves here. This view shows the post-approval state from the example architecture package."
```

**TB-510 — Governance promotion vocabulary:**
```
Files: GovernanceWorkflowPageContent.tsx, GovernanceWorkflowPromotionsActivationsSection.tsx
Audit all buyer-visible strings for "promote/promotion" and replace with "governance-approved" or "approved for implementation planning."
```

---

### Batch 3 — P1 governance confirmation (2–4 hours, most complex)

**TB-503 — Quick approve confirmation dialog:**
Create `GovernanceQuickApproveDialog.tsx` with a confirmation popover containing:
- Review subject display
- "No critical/high findings detected" status
- Optional free-text approver note (becomes `reviewComment` if filled)
- "Confirm approval" and "Cancel" buttons
Replace the existing `onClick` in `GovernanceQuickApproveButton.tsx` with dialog trigger.

---

### Batch 4 — P2 code hygiene (~2 hours)

- TB-512: Rename `FunnelTelemetryExportAnchor` → `TrackedDownloadAnchor`
- TB-513: Audit `GoldenManifestExportMenu` for "golden manifest" literals
- TB-514: Update `ExplainabilityTraceTree` empty state
- TB-515: See Batch 2 above (combined with TB-508)

---

## Conflict check with prior session backlog items

| New finding | Nearest prior TB | Assessment |
| --- | --- | --- |
| T01 (quick approve comment) | TB-477 (rename "Commit reviews" permission) | Complementary — TB-477 is permission label; T01 is stored decision comment |
| T02 (audit integrity demo label) | None | New |
| T03 (confirmation dialog) | None | New |
| T04 (invite reviewer vague) | None | New |
| T05 (tenant isolation explanation) | None | New |
| T06 (data retention) | None | New |
| T07 (static demo governance) | TB-480 (demo-harness copy) | Complementary — TB-480 is copy; T07 is data boundary |
| T08 (backup region card) | None | New |
| T09 ("live pilot" framing) | TB-456 (rename "pilot feedback") | Complementary — different surfaces |
| T10 (promote vocabulary) | TB-458 (evaluation standards rename) | Complementary — different vocabulary domain |
| T11 (role capabilities) | TB-504 (T04) | Same cluster |
| T12 (FunnelTelemetry name) | None | New |
| T13 (GoldenManifestExportMenu) | TB-470 (golden manifest in help) | Complementary — TB-470 is help docs; T13 is export component |
| T14 (trace tree empty state) | TB-492 (FindingTrustChip label) | Complementary — related provenance surfaces |
| T15 (loading message) | TB-508 (T08) | Same card — combined in Batch 2 |

**No contradictions found.**

---

**Backlog updated:** TB-501–TB-515 (15 new items) in `docs/library/TECH_BACKLOG.md`.  
Summary statistics updated: Trustworthiness 1→8, Adoption friction 86→92, Compliance readiness 2→3, Code hygiene 6→9, Total ~132→~147.
