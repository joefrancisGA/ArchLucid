> **Scope:** Contributor-reference — V1 private-beta contract for the in-product **Report Problem** action — not a shipped dialog/API (see **TB-784**–**TB-792**).

# Report Problem — V1 scope contract

**Audience:** Engineering, support, and procurement reviewers defining what structured problem reports may capture in V1.

**Guiding principle:** Customers can forgive defects; they rarely forgive feeling ignored. Report Problem must increase trust without noise, consent fatigue, or silent log exfiltration.

**Canonical registry (code):** `archlucid-ui/src/lib/report-problem-surfaces.ts`  
**Canonical copy (code):** `archlucid-ui/src/lib/report-problem-copy.ts`

---

## 1. Where Report Problem may appear (high-stakes only)

Report Problem is **not** on every error surface. It is allowed only on **fatal or broken** states for core operator workflows:

| Surface | Route / component | In scope when |
| --- | --- | --- |
| Reviews hub hard failure | `/reviews` · `RunsPageView.tsx` | Unexpected API/empty-broken hub response — **not** “no reviews yet” |
| Review detail hard failure | `/reviews/[runId]` · `RunDetailPageView.tsx` | Page-level load failure for a review the operator navigated to |
| Sponsor / value summary hard failure | `/value-report`, `/value-report/*` · sponsor value surfaces | Sponsor summary or value report cannot load after navigation |
| Governance findings queue hard failure | `/governance/findings` · findings queue shell | Queue cannot load (hard fail) — **not** empty queue |
| Review run / commit / export failure | `/reviews/[runId]` · commit/export error shells | Commit, seal, or export blocked with page-level failure (not inline validation toast) |
| API problem cards (high-stakes) | `OperatorApiProblem.tsx` | Server/network failures with correlation context — **excludes** validation-only 400 toasts unless registry expands |
| Layered connectivity errors | `OperatorLayeredConnectivityError.tsx` | Upstream/API unreachable with recovery copy |
| Auth / session break | `OperatorRoleGate.tsx` | User-visible auth/session break (not silent redirect) |

**Explicitly out of scope for V1 Report Problem:**

- Benign empty states (“no reviews yet”, “no findings”).
- Field-level validation toasts and ordinary 400 validation responses.
- Every background polling blip or retryable transient toast.
- Marketing/demo preview surfaces.

---

## 2. Captured fields (with explicit consent)

With operator consent at submit time, a problem report may include:

| Field | Source |
| --- | --- |
| Review id | Route/query when present |
| Workspace id | Operator scope context |
| Tenant id | Operator scope context |
| Product version | API + UI build metadata |
| Browser / client summary | User-agent summary (not full raw dump) |
| Correlation id and/or client request id | `OperatorApiProblem`, headers, or problem JSON |
| Route | Current pathname |
| Error code / title | Problem details or page failure headline |
| Operator note | Optional free text from the dialog |

Submitter identity is limited to what auth already established — do not collect additional mailbox PII in the note prompt.

---

## 3. Explicit non-capture

Report Problem must **never** silently attach or scrape:

- Raw client console/log buffers
- Prompts, model inputs, or LLM traces
- Evidence bodies, architecture uploads, or finding payloads
- Secrets, tokens, or connection strings
- Mailbox or contact PII beyond authenticated identity

---

## 4. Diagnostics posture

- **Optional redacted support bundle** attach only (**TB-787**) — operator must opt in per report.
- **Never** auto-attach diagnostics.
- Manual download at `/administration/settings/support` remains the operator-controlled path (**TB-628** Done).

---

## 5. SLA acknowledgement copy (owner 2026-07-15)

After submit, in-app and email acknowledgements use the same sentence (reference id substituted):

> We received your report (reference **{id}**). We'll respond by the **next business day**.

Canonical formatter: `formatReportProblemAcknowledgement` in `report-problem-copy.ts`.

---

## 6. Engineering follow-on (not this contract)

| TB | Title |
| --- | --- |
| **TB-783** | `ReportProblemContext` assembler |
| **TB-784** | `ReportProblemDialog` UI primitive |
| **TB-785** | Wire into `OperatorApiProblem` + connectivity errors |
| **TB-786** | Registry-driven fatal page failures |
| **TB-787** | Consent-gated redacted bundle attach |
| **TB-788** | `POST /v1/support/problem-reports` intake API |
| **TB-789** | In-app + email auto-ack |
| **TB-790** | Buyer/help copy |
| **TB-791** | Registry drift guard tests |

---

## Related

- **TB-271** (Done) — correlation/request IDs on operator errors
- **TB-628** (Done) — redacted support bundle download
- **`docs/engineering/AGENTS.md`** — engineering pointer to this contract
