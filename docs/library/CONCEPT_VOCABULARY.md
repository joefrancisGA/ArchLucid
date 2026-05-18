> **Scope:** Writer-facing canonical-vs-rejected vocabulary for docs and copy — not the five-minute mental model (`CONCEPTS_IN_5_MINUTES.md`); not term definitions (`GLOSSARY.md`).

# Concept vocabulary (canonical forms)

**Relationship:**

- **[`GLOSSARY.md`](GLOSSARY.md)** — *"What does X mean?"*
- **[`CONCEPTS_IN_5_MINUTES.md`](CONCEPTS_IN_5_MINUTES.md)** — quick mental model for new readers
- **This file** — *"If two phrasings exist, which is canonical in our docs?"*

> **CI guard.** [`scripts/ci/check_concept_vocabulary.py`](../../scripts/ci/check_concept_vocabulary.py) enforces the rules in **§ 1.1** only. This file may quote rejected forms in rationale text and is excluded from the scan.

---

## 1 Canonical vocabulary

### 1.1 CI-enforced rules

| # | Use this (canonical) | Don't use (rejected) | Rationale | First introduced |
|---|----------------------|----------------------|-----------|------------------|
| 1 | **Microsoft Entra ID** | "Azure Active Directory" or "Azure AD" | Microsoft renamed the service in 2023. Continued use of the legacy name confuses customers reading security docs and contradicts [`SECURITY.md`](SECURITY.md). Rejected forms remain valid under **`docs/archive/**`** (CI excludes that tree). | 2026-04-20 |

### 1.2 Reviewer-enforced rules (not yet automated)

Promote a row to § 1.1 only after ripgrep on `docs/` (excluding `docs/archive/`) shows manageable fix volume in the same PR.

| # | Use this (canonical) | Don't use (rejected) | Rationale |
|---|----------------------|----------------------|-----------|
| 1 | **review** (noun — the product session) | "run" when used as the product noun for a governed architecture review session (e.g. "create a run", "the run's findings", "run ID") | ArchLucid's primary product concept is an architecture *review*, not a pipeline *run*. Buyer-facing copy, docs, and UI labels must use **review**. Legitimate uses of "run" (CI run, test run, script run, dry run, **run** the pipeline as a verb) are **not** rejected — only uses where "run" names the ArchLucid review session itself. **2026-05-18:** Buyer/evaluator spine (`docs/` onboarding, `go-to-market/`, `onboarding/` eval guide) refreshed; promotion to § 1.1 CI still requires cleaning remaining library/runbooks and wiring `check_concept_vocabulary.py`. |

---

## 2 Promoting a new rule

1. Add a row to **§ 1.2** with rationale.
2. After one release cycle without review noise, promote to **§ 1.1** and add a matching entry to `RULES` in `scripts/ci/check_concept_vocabulary.py`.
3. Fix existing occurrences in `docs/` in the same PR as the new CI rule.

---

## 3 Related

- [`GLOSSARY.md`](GLOSSARY.md)
- [`CONCEPTS_IN_5_MINUTES.md`](CONCEPTS_IN_5_MINUTES.md)
- [`scripts/ci/check_concept_vocabulary.py`](../../scripts/ci/check_concept_vocabulary.py)
