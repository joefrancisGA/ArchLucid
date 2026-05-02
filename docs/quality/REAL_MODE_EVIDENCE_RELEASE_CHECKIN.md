> **Scope:** Release-owner checklist stub for **real-mode** (Azure OpenAI) agent output evidence — complements offline `tests/eval-corpus` CI. Not a substitute for `docs/quality/MANUAL_QA_CHECKLIST.md` §8.3.

# Real-mode agent evidence — release check-in (stub)

**Purpose:** Satisfy the **“check-in Markdown summary”** gap called out in `docs/library/QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_76_76.md` §9 item 6 without inventing AOAI deployment names.

## Before tagging a release candidate

1. **Reference deployment** — Record the **named** Azure OpenAI resource + deployment used for real-mode checks in private release notes (owner tabled until deployment exists).
2. **Manual gate** — Run **`docs/quality/MANUAL_QA_CHECKLIST.md` §8.3** (*Real-LLM / agent output quality*) against **staging** or a designated host.
3. **Corpus** — For offline parity, see **`docs/library/AGENT_EVAL_CORPUS.md`** and **`scripts/ci/eval_agent_quality.py`**; CI remains credential-free.
4. **Conservative bar** — Align with **`docs/library/AGENT_OUTPUT_EVALUATION.md`**: do not ship when reference-path quality-gate outcomes are **rejected** at configured floors without owner sign-off.

## Artifact (optional)

When real-mode evidence exists, attach a one-page summary (path is owner-chosen, **not** committed with secrets): run ids, agent types, structural/semantic floors, and **simulator vs real** labels.

**Last reviewed:** 2026-05-02
