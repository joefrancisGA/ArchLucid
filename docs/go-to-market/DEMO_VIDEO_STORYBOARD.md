> **Scope:** Shot-by-shot storyboard for the first buyer-facing demo video cut (&lt;3 minutes). Narration and timing align with [`DEMO_VIDEO_SCRIPT.md`](DEMO_VIDEO_SCRIPT.md) § Two-minute video script.

# Demo video storyboard

**Target length:** Under **3 minutes** for the first buyer-facing cut (core path: wizard → execute → findings → commit; trim governance/compare if over budget).

**Last reviewed:** 2026-06-02

**Script source:** [`DEMO_VIDEO_SCRIPT.md`](DEMO_VIDEO_SCRIPT.md)

## Shot table

| Segment | URL / screen | Action | Narration extract | Annotation | Duration (s) |
| --- | --- | --- | --- | --- | ---: |
| Opening | Marketing home or operator home | Hold static frame; optional split slide (wiki chaos vs manifest table) | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns a structured request into governed, auditable outputs you can diff and replay." | Title-safe lower third optional | 15 |
| Create review | `/reviews/new` | Step through wizard; paste 3–4 sentence migration scenario | "An operator starts from a guided flow: system name, constraints, and requirement lines that feed the ingestion pipeline—no mystery prompts." | Highlight structured fields, not a chat box | 20 |
| Execute | Run detail → pipeline timeline | Show stages advancing (simulator or pre-seeded run) | "Execution runs the multi-stage authority pipeline: ingestion, graph, findings, decisioning, artifacts—visible in the UI." | Point to stage labels as each completes | 15 |
| Findings | Run detail findings panel or `/runs/{runId}/findings/{findingId}` | Open one finding; expand explainability trace | "Findings aren't a chat paragraph. Each item carries structured traces you can inspect for what was checked and why." | Show severity, confidence, recommended action | 25 |
| Commit + manifest | Run detail → Commit → Artifacts | Click commit; show manifest summary and one download row | "When ready, commit produces a golden manifest and downloadable artifacts—the reviewable package for your program." | Emphasize versioned manifest, not slide deck | 15 |
| Governance (optional) | `/governance` or policy packs | Brief policy or approval screen; skip if not configured | "Policy packs and pre-commit gates can block promotion when severities exceed thresholds." | Say "when enabled for your tenant" if gated | 15 |
| Compare (optional) | `/compare` | Select two reviews; show structured deltas | "When designs iterate, compare two reviews with structured deltas—not just a text diff." | Trim if total runtime exceeds 2:45 | 15 |
| Close | `/why-archlucid` or home CTA | Logo + contact/signup | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | End card: archlucid.net/contact | 10 |

**Trim order if over 3:00:** Governance → Compare → shorten Opening split slide.

## Pre-production checklist

- [ ] Staging or local environment with seeded Contoso demo tenant running
- [ ] Browser zoom at 100%, full-screen, clean bookmark bar
- [ ] Loom / Camtasia recording started before narration begins
- [ ] Close all non-ArchLucid browser tabs
- [ ] Test audio quality before recording

## Post-production checklist

- [ ] Trim dead air at start/end
- [ ] Add title card: **ArchLucid — Defensible architecture, on demand**
- [ ] Add captions for accessibility
- [ ] Upload to Loom or Wistia (not YouTube for sales demo — avoid competitor ads)
- [ ] Add link in [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) and [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)

**Production owner:** TB-236 (screen recording) — deferred until owner returns media per `V1_DEFERRED.md`.
