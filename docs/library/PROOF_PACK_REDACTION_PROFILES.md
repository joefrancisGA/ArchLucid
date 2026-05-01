> **Scope:** Redaction **profiles** for ArchLucid **proof-of-value** and **run-evidence** packages (Markdown/PDF/bundles). Complements assembly steps in **[PROOF_OF_VALUE_SNAPSHOT.md](PROOF_OF_VALUE_SNAPSHOT.md)**. **Not** legal advice; customer counsel owns external distribution when regulated data may be present.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# Proof pack redaction profiles

**Objective.** Make “buyer-safe” **operational**: every pack is built under **one named profile** so operators know what may leave the tenant boundary and what must be removed or generalized.

**Assumptions.**

- Upstream controls (**`LlmPromptRedaction`**, support-bundle filtering) reduce risk but **do not replace** human review for external profiles — see **[LLM_PROMPT_REDACTION.md](../runbooks/LLM_PROMPT_REDACTION.md)** (redaction is not a guarantee).
- **Marketing demo PDFs** (`WhyArchLucidPackBuilder`, anonymous demo preview) are **pre-classified** as synthetic; they still ship the *demo tenant — replace before publishing* banner and are **not** a substitute for these profiles when attaching **real** tenant runs.

**Constraints.**

- Do not treat this file as a **procurement pack** manifest; procurement uses **`scripts/build_procurement_pack.py`** and **[TRUST_CENTER.md](../go-to-market/TRUST_CENTER.md)**.
- Historical SQL migrations and RLS object naming are unchanged by this document.

---

## 1. Profile summary

| Profile id | Typical audience | Leaves customer trust boundary? |
| --- | --- | --- |
| **`internal-pilot`** | Customer pilot team + ArchLucid delivery (Slack/Teams, internal ticket) | **No** — stays inside customer-controlled collaboration |
| **`customer-approved-external`** | Sponsor, procurement advisor, **NDA** counterparty outside the pilot team | **Yes** — only after **written** customer approval for *this* artifact set |
| **`anonymous-benchmark`** | Public or gated benchmark / methodology conversation (no tenant tie) | **Yes** — only **aggregated** metrics + public doc links; **no** stable tenant or run fingerprint |

Pick **one** profile per pack version. If content mixed from multiple runs, apply the **strictest** profile (usually **`customer-approved-external`** rules to everything in the zip/email).

---

## 2. Mandatory removals (all profiles)

The following **never** appear in any forwarded pack (replace with `[REDACTED]` or omit the section):

| Category | Examples |
| --- | --- |
| **Secrets & credential-shaped** | API keys, PATs, connection strings, private keys, webhook secrets, OAuth refresh tokens |
| **Bearer material** | `Authorization` headers, session cookies, magic links with embedded tokens |
| **Cloud model credentials** | Azure OpenAI keys, inference endpoint secrets, subscription keys usable to invoke models |
| **Raw auth captures** | Full HTTP traces unless every header/body field is reviewed; strip cookies and auth headers per **[PROOF_OF_VALUE_SNAPSHOT.md](PROOF_OF_VALUE_SNAPSHOT.md)** §7 |

These **LLM/trace categories** are indicative, not exhaustive (**[LLM_PROMPT_REDACTION.md](../runbooks/LLM_PROMPT_REDACTION.md)**): email, government-id / financial-card shapes, JWT-shaped tokens, long high-entropy strings — **plus** any customer-specific secret format discovered during review.

---

## 3. Profile rules (by id)

### 3.1 `internal-pilot`

**Purpose.** Fast iteration inside the customer’s pilot boundary.

| Rule | Requirement |
| --- | --- |
| **Identifiers** | **Tenant id, workspace id, internal project names, URLs to intranet/repos/wiki, personal work emails** may appear **only** on channels the customer already treats as confidential (e.g. private Teams). |
| **Run content** | Full finding text, manifest excerpts, and support-bundle-style dumps are **allowed** subject to customer **collaboration tool** policy — not an invitation to paste into public GPT. |
| **LLM / traces** | Raw prompts/completions **discouraged**; prefer summaries. If shared for debugging, mark **internal-only** and retain per customer retention policy (**[SECURITY.md](SECURITY.md)** — PII-sized exports). |
| **Support bundle** | If attaching **`support-bundle --zip`**, follow **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** — review even though literals are filtered. |

### 3.2 `customer-approved-external`

**Purpose.** Sponsor-forwardable PDF/Markdown/email after **explicit** customer sign-off (**this pack**, **this date**, **these recipients**).

| Rule | Requirement |
| --- | --- |
| **Approval** | Record approver role + date in the pack cover note or `manifest.json` sidecar (free text field is fine). |
| **Tenant fingerprint** | **Remove or generalize**: customer legal name, internal codenames, **tenant/workspace GUIDs**, **user PII**, internal hostnames, non-public Azure resource names, file paths. **Run id**: omit unless customer approves *and* it does not enable re-identification with other leaked context. |
| **Architecture text** | Generalize system descriptions (“Tier-2 payment adapter”) or quote **only** approved sentences. Remove URLs except **public** doc links (yours or theirs if they asked). |
| **Evidence** | Prefer **aggregates**: severity counts, timing (wall clock), explainability **ratios**, audit/event **counts**. Avoid screenshots; if included, scrub window titles, sidebars, and account chips. |
| **LLM / traces** | **No** raw prompts/completions or full trace blobs. **No** stack traces or raw SQL. |
| **HTTP / k6** | Only summary JSON with **no** request bodies; no environment hostnames that identify the customer. |
| **ROI** | Numbers tied to customer assumptions are **customer statements** — label source row / owner; **do not** add new financial claims (**[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)**). |

### 3.3 `anonymous-benchmark`

**Purpose.** Share **methodology and aggregate numbers** only (conference, blog, generic sales “how we measure”).

| Rule | Requirement |
| --- | --- |
| **Identity** | **No** customer name, **no** tenant/workspace/run id, **no** dated narrative that uniquely matches one engagement. |
| **Content** | Only:** wall-clock ranges**, percentile tables, pass/fail vs **published** targets (**`REAL_MODE_BENCHMARK.md`**), k6 **aggregates** without hostnames, methodology bullets pointing to **this repo’s public docs**. |
| **Comparison** | Optional **synthetic** or **demo** pack only, with the standard demo banner — **never** real finding prose. |

---

## 4. Attestation (recommended)

For **`customer-approved-external`**, add a cover block:

```text
Redaction profile: customer-approved-external
Built by: <name, org>
Approval: <name, role> — <ISO date>
Reviewed for: secrets, tenant ids, internal URLs, raw LLM/trace, PII-shaped tokens
Exceptions noted: <none | see appendix>
```

---

## 5. Related documentation

- **[PROOF_OF_VALUE_SNAPSHOT.md](PROOF_OF_VALUE_SNAPSHOT.md)** — assembly workflow and sponsor one-pager template.
- **[SECURITY.md](SECURITY.md)** — PII-sized exports and retention posture.
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** — support bundle contents and review-before-send.
- **[pen-test-summaries/README.md](../security/pen-test-summaries/README.md)** — parallel discipline for redacted **security** summaries (internal URLs, tenant ids in repro).
- **[TRUST_CENTER.md](../go-to-market/TRUST_CENTER.md)** — procurement pack / assurance artifacts (different artifact class).
