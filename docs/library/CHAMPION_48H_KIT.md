> **Scope:** Champion enablement — second real architecture review in ~48h using SECOND_RUN + sponsor artifacts; demo-data warnings; not a legal or ROI guarantee.

# Champion kit — ~48 hour second architecture review

**Audience:** Internal or customer **champions** repeating Core Pilot on **their** inputs after trying demo or first session.

**Canonical sponsor story:** [`docs/EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md) · **Measurement:** [`docs/library/PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md).

---

## 1. Fastest path (CLI)

1. Copy template: [`docs/library/SECOND_RUN.md`](SECOND_RUN.md).
2. Run: `archlucid second-run SECOND_RUN.toml` (or paste TOML in operator **New run** wizard).
3. Execute pipeline → **Finalize** when ready → open artifacts.

---

## 2. Success criteria (minimum)

| Check | Question |
|-------|----------|
| **Real inputs** | Brief reflects an actual initiative, not Contoso demo copy-paste |
| **Committed manifest** | Review package exists (manifest + ≥1 artifact) |
| **Sponsor-safe export** | Use first-value report / PDF — see §4 |

---

## 3. Copy-paste email skeleton (internal)

> Subject: Architecture review pilot — Day 2 proof  
> Body:  
> We reproduced our workflow on **[one-sentence initiative]** using ArchLucid’s Core Pilot path.  
> **Support run id:** `[runId]`  
> **Outcome:** Committed review package with [N] findings ([severity mix]).  
> **Attached / linked:** ArchLucid first-value report PDF (tenant-generated).  
> **Not for external decks:** Any numbers from the **Contoso** demo tenant are placeholders only — this run uses our inputs.

---

## 4. Sponsor PDF / Markdown

After commit: operator run detail — **Email this run to your sponsor** / first-value report endpoints documented in [`docs/EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md) (`POST /v1/pilots/runs/{runId}/first-value-report.pdf`, Markdown sibling).

---

## 5. Demo numbers — non-negotiable

If `RequestId` matches Contoso demo prefixes, reports show the **demo tenant** banner. **Do not** screenshot those tables for customer decks as “our pilot results.” See [`docs/library/PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md) §4.1.1.

---

## Related

[`docs/library/DOGFOOD_PILOT_KIT.md`](DOGFOOD_PILOT_KIT.md) · [`docs/go-to-market/STEERING_DECISION_MEMO_TEMPLATE.md`](../go-to-market/STEERING_DECISION_MEMO_TEMPLATE.md)
