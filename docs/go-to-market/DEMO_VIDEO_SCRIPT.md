> **Scope:** Live-call demo scripts for the core pilot path. The **five-minute version** (M-03) opens on a **finished architecture package** — never generation-first. The **30-minute principal-architect variant** adds Graph, Ask, a created-package bridge, and **Compare** between reviewed and created packages. The two-minute version targets async video drop-off. Neither is a promise of marketing artifacts already produced.

# Demo scripts

---

## Five-minute live call script (M-03)

**Audience:** Prospects and pilot sponsors on a 30-minute discovery or demo call. Use the five-minute version when you have a live product environment and a prospect who has agreed to see the product.

**Grounding:** V1 Pilot layer only. All routes exist in `archlucid-ui` unless noted as conditional. If a capability is behind a feature flag or commercial tier, say "when this is enabled for your tenant" — never imply universal availability.

**Setup:** Run with Simulator agents for a deterministic timeline. Use the Contoso Retail demo tenant (Docker seed) or the static showcase tenant (`claims-intake-modernization`). Have the browser at 1440×900, 100% zoom, bookmarks hidden.

**Trust ladder:** Open on a **completed architecture package**. Do **not** start at `/reviews/new` or describe generation speed.

---

### Opening (0:00–0:30) — Frame the problem

> "I want to show you ArchLucid from first principle — what it actually delivers in practice, not what it looks like in a screenshot.
>
> The problem we are solving: architecture review is one of the slowest, most manual steps in engineering. Teams assemble evidence in wikis and slide decks. Senior architects review everything serially. Decisions are made in meetings and reconstructed months later. And AI tools produce fluent prose with no evidence links, no policy context, no governance trail.
>
> ArchLucid packages that work into a governed **architecture package**: structured findings, explicit confidence limits, a signed manifest, and exports you can hand to an ARB or auditor. Let me show you a finished package first — then we can talk about how new packages enter the same pipeline."

**Visual:** Home or Architecture packages list. No wizard.

---

### Scene 1 (0:30–1:15) — Open a finished package

**Route:** `/reviews/claims-intake-modernization` (showcase) **or** Contoso hardened run `6e8c4a102b1f4c9a9d3e10b2a4f0c502` (Docker seed)

> "This is a completed architecture package — not a draft prompt. Status, findings, and manifest linkage are already here because the governed pipeline ran against real intake context.
>
> Notice we are not opening with 'type a prompt and watch it generate.' The value is defensible output: what was examined, what was found, and what was recorded for audit."

**Visual:** Review detail header, summary cards, pipeline complete state. Point to **Reviewed** origin if visible.

---

### Scene 2 (1:15–2:15) — Findings, explainability, and explicit limits

**Route:** Findings panel or `/reviews/{runId}/findings/{findingId}`

> "Each finding has severity, confidence, and a recommended action. The differentiator is the explainability trace: what was examined, which rules applied, what evidence was cited, and where confidence stops.
>
> When a finding flags an evidence gap, we say so explicitly — this is not 'the AI always concludes.' Operators can attach counter-evidence and record decisions; that trail stays in the audit log."

**Visual:** Expand one finding trace. Optionally show a finding with an evidence-gap signal.

---

### Scene 3 (2:15–3:15) — Architecture package and export

**Route:** Review detail → architecture package summary and artifacts

> "When the architect accepts the package, Finalize produces an architecture package (API: golden manifest): a signed, versioned snapshot of findings, decisions, and artifacts on an append-only audit chain. This is what you hand to your architecture review board — not a chat export.
>
> Artifacts download as Markdown, DOCX, or ZIP. Consulting engagements can whitelabel the DOCX deliverable."

**Visual:** Manifest summary (counts). One artifact row + download.

---

### Scene 4 (3:15–4:00) — Creation bridge (one line only)

**Route:** Home → **Open created sample** → `/reviews/northwind-copilot-rag-platform`

> "Creation uses the same governed pipeline — findings, confidence, manifest — not a separate toy path. Here is a **Created** sample package in one click; we do not need to run intake live in a five-minute slot."

**Visual:** **Created** badge on list or detail. Ten-second peek; return to reviewed package if time is tight.

---

### Scene 5 (4:00–4:30) — Compare (optional)

**Route:** `/compare` — Contoso baseline vs hardened (`…c501` / `…c502`) when Docker seed is available

> "When designs iterate, compare two packages for structured deltas — findings added, resolved, severity shifts — not a text diff."

**Visual:** Select two packages; highlight delta rows.

---

### Closing (4:30–5:00) — Offer

> "What I am offering is this workflow on your real architecture context. The productized engagement is an ArchLucid AI and Cloud Architecture Readiness Review — we apply relevant policy packs and deliver the exported report: findings register, decision record, executive summary.
>
> The next step is usually a 30-minute intake call. Want to set that up?"

---

### Q&A prompts (keep on hand)

| Likely question | Suggested answer |
|-----------------|-----------------|
| "How does the AI know our architecture?" | "It doesn't infer it — you describe the request and attach your evidence. The agents analyze what you provide, not what they imagine." |
| "What if a finding is wrong?" | "You annotate it, attach counter-evidence, and record the decision. The trace stays in the audit log." |
| "Is this replacing our architects?" | "No. It removes the manual assembly burden so your senior architects spend time on judgment, not preparation." |
| "What's the governance piece?" | "Policy packs define what rules apply. Pre-finalize gates and approval workflows enforce segregation of duties." |
| "Can we self-host?" | "Yes — Azure-native, Terraform'd infrastructure. For evaluation I can run this as a service so you don't set up first." |

---

## 30-minute principal-architect live script

**Audience:** Enterprise architects evaluating depth — graph traceability, Ask, create-vs-review symmetry, and governance close.

**Grounding:** Same as five-minute script. Use showcase IDs when Docker seed is unavailable.

| Phase | Time | Route(s) | Goal |
|-------|------|----------|------|
| Finished reviewed package | 0:00–8:00 | `/reviews/claims-intake-modernization` | Findings, traces, manifest (same spine as five-minute) |
| Graph + Ask | 8:00–14:00 | `/graph`, `/ask` | Evidence trail and grounded Q&A on the opened package |
| Created package bridge | 14:00–20:00 | Home → `/reviews/northwind-copilot-rag-platform` | Show **Created** origin; same findings/manifest shape (**TB-742**) |
| **Compare reviewed vs created** | 20:00–26:00 | `/compare` | Left: `claims-intake-modernization` (Reviewed); Right: `northwind-copilot-rag-platform` (Created) — structured deltas, not generation speed |
| Governance close | 26:00–30:00 | `/governance` or approval queue | Approval / promotion posture; offer pilot intake |

**Compare talk track:** "Same noun — architecture package — two workflows. Reviewed intake vs born-governed creation. Compare shows semantic drift between packages, not which model typed faster."

**Do not** open this session at `/reviews/new` unless the prospect explicitly asks to see intake live; defer wizard to a follow-up working session.

---

## Two-minute video script (≈2 minutes)

**Audience:** prospects and executive sponsors who cannot self-host the API before a call. **Grounding:** [V1_SCOPE.md](../library/V1_SCOPE.md) Pilot layer only; no V1.1-only connectors.

**Trust ladder:** Open on a **finished package** — not the wizard.

---

## Storyboard (timing)

| Time | Scene | Architect workspace route(s) | VO (voiceover, ~300 words total) | Visual |
|------|--------|------------------------------|-----------------------------------|--------|
| 0:00–0:15 | Opening | Marketing or architect home | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns governed intake into auditable architecture packages you can diff and replay." | Split: messy wiki slide vs clean architecture package table (static slide ok). |
| 0:15–0:35 | Finished package | `/reviews/claims-intake-modernization` | "Start from a completed package: status, findings, and architecture package linkage already on screen — not a blank wizard." | Review detail summary; pipeline complete. |
| 0:35–0:55 | Findings + explainability | Finding panel or finding detail | "Findings carry structured traces — what was checked, which rules applied, and where confidence stops." | Expand explainability fields; optional evidence-gap tag. |
| 0:55–1:15 | Package + export | Review detail → architecture package + artifacts | "Finalize produces a signed architecture package (API: golden manifest) and downloadable artifacts — the sponsor-ready package." | Package summary + one download row. |
| 1:15–1:30 | Creation bridge | `/reviews/northwind-copilot-rag-platform` | "Creation follows the same pipeline; here is a Created sample in one click." | **Created** badge; brief. |
| 1:30–1:45 | Compare (optional) | `/compare` | "Compare two packages for structured deltas when designs iterate." | Reviewed vs created or baseline vs hardened. |
| 1:45–1:55 | Governance (if enabled) | `/governance` | "Policy packs and approvals enforce segregation of duties when enabled." | Brief queue screen. |
| 1:55–2:00 | Close | `/why` or home | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | Logo + CTA. |

Trim governance or compare if time is tight — core story is **finished package → findings → manifest → export**.

---

## Recording instructions

1. **Stack:** Prefer `scripts/demo-start.ps1` / compose **full-stack** with **Simulator** agents so the timeline stays deterministic; use **DevelopmentBypass** locally per [CORE_PILOT.md](../CORE_PILOT.md).
2. **Browser:** Chromium, 1440×900 or 1920×1080, **100%** zoom; hide bookmark bar; dark or light shell consistent throughout.
3. **Data:** Contoso Docker seed for compare pairs; showcase routes `claims-intake-modernization` + `northwind-copilot-rag-platform` for finished-package + creation bridge without seed ([DEMO_QUICKSTART.md](./DEMO_QUICKSTART.md)).
4. **Audio:** Narrate at ~150 wpm; total VO above is ~260 words → ~1:45; pad with transitions or shorten scenes.
5. **Tools:** OBS Studio or similar; capture **browser** only unless you show CLI; no secrets on screen.

---

## Acceptance checklist

- Demos **open on a completed architecture package** — never `/reviews/new` generation-first.
- Five-minute and two-minute scripts include manifest + export; five-minute and 30-minute scripts include **Compare** (30-minute: reviewed vs created).
- Routes exist in **`archlucid-ui`** (App Router segments under `(operator)` / `(marketing)`).
- Claims match **Pilot** capabilities in **[V1_SCOPE.md](../library/V1_SCOPE.md)** §2.
- If a capability is gated (commercial tier / feature flag), voiceover states "when enabled for your tenant" rather than implying universal availability.
