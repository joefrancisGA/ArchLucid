> **Scope:** Live-call demo script and two-minute video script for the core pilot path. The **five-minute version** (M-03) is the primary script for founder-led discovery calls and paid pilot intros. The two-minute version targets async video drop-off. Neither is a promise of marketing artifacts already produced.

# Demo scripts

---

## Five-minute live call script (M-03)

**Audience:** Prospects and pilot sponsors on a 30-minute discovery or demo call. Use the five-minute version when you have a live product environment and a prospect who has agreed to see the product.

**Grounding:** V1 Pilot layer only. All routes exist in `archlucid-ui` unless noted as conditional. If a capability is behind a feature flag or commercial tier, say "when this is enabled for your tenant" — never imply universal availability.

**Setup:** Run with Simulator agents for a deterministic timeline. Use the Contoso Retail demo tenant so findings and manifests look realistic. Have the browser at 1440×900, 100% zoom, bookmarks hidden.

---

### Opening (0:00–0:30) — Frame the problem

> "I want to show you ArchLucid from first principle — what it actually does in practice, not what it looks like in a screenshot.
>
> The problem we are solving: architecture review is one of the slowest, most manual steps in engineering. Teams assemble evidence in wikis and slide decks. Senior architects review everything serially. Decisions are made in meetings and reconstructed months later. And AI tools — Copilot, ChatGPT — produce fluent prose with no evidence links, no policy context, no governance trail.
>
> ArchLucid is structured around a different model: Capture the context, gather Evidence, run the Review, surface structured Findings, record Decisions, and produce a Report you can hand to an ARB or auditor. Let me show you that path end to end."

**Visual:** Keep the landing page or home screen visible. No prompts yet.

---

### Scene 1 (0:30–1:15) — Create a review

**Route:** `/reviews/new` (or the wizard entry point in the operator shell)

> "An operator — that is the person running the review — starts from a guided wizard. System name, a brief description of the architecture request, constraints, and requirement lines.
>
> This is not a freeform prompt box. The wizard shapes the input so the downstream agents receive consistent context — topology, cost, compliance, and design quality. I'll paste a short description of a cloud migration scenario for this demo."

**Visual:** Fill in the wizard fields. Paste a 3–4 sentence description. Highlight the structured input — not a chat prompt.

---

### Scene 2 (1:15–2:00) — Execute

**Route:** Review detail → pipeline timeline / status view

> "Once submitted, the authority pipeline runs. You can see the stages: context ingestion, knowledge graph construction, findings analysis, decisioning, artifact synthesis. Each stage completes in sequence and the UI shows live progress.
>
> The key thing here is that this is not a chat round-trip. This is a governed multi-stage pipeline — the same stages run the same way every time, against the same context, and the outputs are versioned and replayable."

**Visual:** Show the pipeline stages progressing. Point to stage labels. Let it complete or use a pre-seeded review that is already done.

---

### Scene 3 (2:00–3:00) — Findings and explainability

**Route:** Findings panel on review detail or `/reviews/{reviewId}/findings/{findingId}`

> "The findings board is where the review output lives. Each item has a severity rating, a confidence score, and a concrete recommended action. But the differentiator is the explainability trace.
>
> Every finding records: what was examined, which rules were applied, what evidence was cited, what conclusion was reached, and what the stated limit of confidence is. This is not AI said so. This is the full reasoning trail — and it is structured, not a paragraph of prose.
>
> If a finding says your topology has a single point of failure in the data tier, the trace shows exactly what the agent saw and which topology rules it applied to reach that conclusion. You can challenge it. You can attach your own evidence. And that decision is recorded."

**Visual:** Open one finding. Expand the explainability trace fields. Show the severity, confidence, recommended action. Optionally open a second finding of a different type.

---

### Scene 4 (3:00–3:45) — Commit and manifest

**Route:** Review detail → commit button → manifest summary and artifacts

> "When the operator is satisfied with the findings — they can add evidence, annotate findings, or raise decisions — they commit. Commit produces a golden manifest: a versioned snapshot of the review, findings, decisions, and artifacts. This is the package you hand to your architecture review board.
>
> The artifacts are downloadable: structured Markdown, DOCX, or a ZIP bundle. If you are doing a consulting engagement, the DOCX export is the deliverable — and it supports whitelabeling so the report carries your firm's name."

**Visual:** Click commit. Show the manifest summary — finding counts, decision counts. Show one artifact row and the download button.

---

### Scene 5 (3:45–4:30) — Compare across reviews (if time)

**Route:** `/compare`

> "When an architecture changes — a design iteration, a scope revision — you can compare two reviews side by side. The compare view shows structured deltas: findings added, findings resolved, severity shifts, and manifest differences. This is not a text diff. It is a semantic diff of your architecture decisions over time.
>
> For regulated teams, this is the drift visibility they need. Change from review A to review B is traceable, replayable, and documented — not reconstructed from memory."

**Visual:** Select two reviews on the compare page. Show the delta highlights.

---

### Closing (4:30–5:00) — Offer

> "What I am offering is a way for your team to run this workflow on your real architecture context, not a demo scenario. The productized engagement is called an ArchLucid AI and Cloud Architecture Readiness Review — we go through this together, apply relevant policy packs for your domain, and the deliverable is the exported report: findings register, decision record, executive summary.
>
> The next step is usually a 30-minute intake call where I learn your system context. From there, I scope and quote the review. Want to set that up?"

---

### Q&A prompts (keep on hand)

| Likely question | Suggested answer |
|-----------------|-----------------|
| "How does the AI know our architecture?" | "It doesn't infer it — you describe the request and attach your evidence. The agents analyze what you provide, not what they imagine." |
| "What if a finding is wrong?" | "You annotate it, attach counter-evidence, and record the decision. The trace stays in the audit log. You're not stuck with the AI's conclusion." |
| "Is this replacing our architects?" | "No. It removes the manual assembly burden so your senior architects spend time on judgment, not preparation." |
| "What's the governance piece?" | "Policy packs define what rules apply to a review. Pre-commit gates can block promotion when findings exceed severity thresholds. Approval workflows enforce segregation of duties." |
| "Can we self-host?" | "Yes — the stack is Azure-native and the infrastructure is fully Terraform'd. For an evaluation, I'm running this as a service on your behalf so you don't need to set it up first." |

---

## Two-minute video script (≈2 minutes)

**Audience:** prospects and executive sponsors who cannot self-host the API before a call. **Grounding:** [V1_SCOPE.md](../library/V1_SCOPE.md) Pilot layer only; no V1.1-only connectors.

---

## Storyboard (timing)

| Time | Scene | Operator UI route(s) | VO (voiceover, ~300 words total) | Visual |
|------|--------|----------------------|-----------------------------------|--------|
| 0:00–0:15 | Opening | Marketing or operator home | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns a structured request into governed, auditable outputs you can diff and replay." | Split: messy wiki slide vs clean manifest table (static slide ok). |
| 0:15–0:35 | Create review — wizard | `/runs/new` (legacy path; product term **review**) | "An operator starts from a guided flow: system name, constraints, and requirement lines that feed the ingestion pipeline—no mystery prompts." | Highlight wizard steps; paste short description. |
| 0:35–0:50 | Execute | Run detail → timeline / status | "Execution runs the multi-stage authority pipeline: ingestion, graph, findings, decisioning, artifacts—visible in the UI." | Show pipeline progressing (simulator or seeded env). |
| 0:50–1:15 | Findings + explainability | `/runs/{runId}/findings/{findingId}` or finding panel on run | "Findings aren't a chat paragraph. Each item carries structured traces you can inspect for what was checked and why." | Expand Explainability / trace fields. |
| 1:15–1:30 | Commit + manifest | Run detail → commit + Artifacts | "When ready, commit produces a golden manifest and downloadable artifacts—the reviewable package for your program." | Commit button → manifest summary + one artifact row. |
| 1:30–1:45 | Governance (optional if enabled) | Policy packs or governance queue | "Policy packs and pre-commit gates can block promotion when severities exceed thresholds—segregation-of-duties workflows sit on the Operate layer." | Brief policy or approval screen; skip if not configured. |
| 1:45–1:55 | Compare | `/compare` (two `runId`s) | "When designs iterate, compare two reviews with structured deltas—not just a text diff." | Select two reviews (`runId`); show delta highlights. |
| 1:55–2:00 | Close | `/why-archlucid` if available | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | Logo + CTA (contact / signup). |

Trim governance/compare if time budget is tight—core story is **wizard → execute → findings → commit**.

---

## Recording instructions

1. **Stack:** Prefer `scripts/demo-start.ps1` / compose **full-stack** with **Simulator** agents so the timeline stays deterministic; use **DevelopmentBypass** locally per [CORE_PILOT.md](../CORE_PILOT.md).
2. **Browser:** Chromium, 1440×900 or 1920×1080, **100%** zoom; hide bookmark bar; dark or light shell consistent throughout.
3. **Data:** Use the Contoso Retail demo tenant so run ids and manifests look realistic ([DEMO_QUICKSTART.md](./DEMO_QUICKSTART.md)).
4. **Audio:** Narrate at ~150 wpm; total VO above is ~260 words → ~1:45; pad with transitions or shorten scenes.
5. **Tools:** OBS Studio or similar; capture **browser** only unless you show CLI; no secrets on screen.

---

## Acceptance checklist

- Routes exist in **`archlucid-ui`** (App Router segments under `(operator)` / `(marketing)`).
- Claims match **Pilot** capabilities in **[V1_SCOPE.md](../library/V1_SCOPE.md)** §2.
- If a capability is gated (commercial tier / feature flag), voiceover states "when enabled for your tenant" rather than implying universal availability.

