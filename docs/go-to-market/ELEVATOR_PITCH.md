> **Reviewed:** 2026-07-25

> **Scope:** GTM copy — elevator pitch scripts for founder-led outreach; grounded in shipped V1 capabilities per [`V1_SCOPE.md`](../library/V1_SCOPE.md). Basis for **M-02** and outreach talk-track alignment in **M-34**.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Elevator pitch scripts

**Audience:** Founder using these in conversations, email, LinkedIn outreach, and live demos.

**Last reviewed:** 2026-07-25

**Relationship:** [`POSITIONING.md`](POSITIONING.md) owns the canonical tagline and positioning statement. [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) is the sponsor story of record. This file contains **verbal delivery scripts** — edit here when talk-track drifts from the brief, then reconcile the brief.

**Rule:** Every claim maps to a shipped V1 capability. Do not imply real-time cloud connectivity, self-serve checkout, or third-party connector availability unless those milestones have shipped per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).

---

## 30-second pitch

> "Architecture review is one of the slowest, most manual parts of the engineering process. ArchLucid turns a structured request into an evidence-backed architecture package — findings prioritized, decisions recorded, audit trail complete. I use it to deliver architecture reviews that ARBs and security partners can actually follow. Happy to show you a sample report."

**When to use:** cold outreach, conference introduction, LinkedIn connection request follow-up.

---

## One-minute pitch (M-02)

> "Architecture review is a bottleneck for almost every engineering team I talk to. A small group of senior architects reviews every major proposal. Reviews take weeks. Different reviewers apply different standards. And decisions end up in email threads nobody can find six months later — or worse, compliance gaps surface in production instead of during design.
>
> ArchLucid gives teams a structured way out of that.
>
> You bring your architecture materials — topology, requirements, constraints, existing evidence. ArchLucid runs a governed multi-agent analysis: topology, cost, compliance, design quality. It surfaces a prioritized findings board where every risk is severity-ranked, evidence-cited, and paired with a concrete recommended action.
>
> The output is a defensible architecture package: a signed review record anchored to a full audit chain, a findings register, and an exportable report your ARB, your CTO, and your auditors can follow — not a chat transcript.
>
> I offer this as a service-led engagement — we run the review together on your real architecture context and you walk away with the report. Want to see what that looks like for a system like yours?"

**When to use:** outreach email body, initial discovery call opening, Upwork proposal narrative.

**Timing:** Aim for 55–65 seconds delivered at natural pace (~150 wpm).

---

## Two-minute pitch (sponsor / CTO)

> "Here is the problem as I see it. Enterprise architecture review relies on manual effort from a small pool of senior architects. Reviews are slow, inconsistent, and poorly documented. Decisions are made in meetings and reconstructed months later when an auditor asks what happened. And AI tools built for chat — Copilot, ChatGPT — do not help here because they produce fluent prose with no evidence links, no policy context, and no governance trail.
>
> ArchLucid is built specifically for this gap. It coordinates a multi-agent pipeline — four specialized AI agents cover topology, cost, compliance, and design quality — against a structured architecture request. Every finding it surfaces carries an explainability trace: what was examined, which rules applied, what was concluded, and why. Every decision recorded against that finding is auditable and replayable.
>
> The output is what I call an architecture package: a signed review record anchored to a full audit chain, structured findings, stated limits where the system does not conclude, and an executive summary your sponsor can read in five minutes. Exportable as DOCX or PDF, whitelabeled if needed.
>
> I offer this as a productized service — an ArchLucid AI and Cloud Architecture Readiness Review — where I run the workflow on your real architecture context and deliver the package. The cost is in the range of a few days of senior architect time at a fraction of the calendar delay.
>
> I would rather show you a sample report than pitch slides. Do you have 30 minutes to walk through what the output looks like for a cloud-based system?"

**When to use:** 30-minute discovery call, sponsor introductions, written proposal opening.

---

## Founder-led consulting line (outreach / LinkedIn)

> "I use ArchLucid to deliver evidence-backed AI and cloud architecture reviews for teams that need defensible decisions, not just diagrams."

**When to use:** LinkedIn headline or summary, outreach signature, Upwork bio.

---

## M-18 outreach message templates

Founder-led "20 warm contacts" campaign (GTM **M-18**). Companion to **M-17** (list) and **M-19** (demos). Claims trace to this file and [`POSITIONING.md`](POSITIONING.md); guardrails in [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise). **Not a sales pitch** — ask for professional opinion / 10-minute reaction.

### Framing rules

- Ask for feedback, not a sale; personalize every send; one send + one bump only.
- Ground claims in shipped V1; no mass BCC; skip disqualified segments per [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md).

### LinkedIn connection-request note (≤300 characters)

```
Hi <<FIRST_NAME>> — <<SHARED_CONTEXT>>. I built a tool for evidence-backed architecture reviews and would value 10 minutes of your take. Would love to connect.
```

### Warm outreach (1st-degree / former colleagues)

```
Hi <<FIRST_NAME>>,

<<PERSONALIZED_OPENER>>

I've been heads-down building ArchLucid — it turns architecture review from scattered opinion into an evidence-backed decision package: findings prioritized, evidence cited, decisions recorded, with an exportable report your ARB or auditor can actually follow. Not another chat-with-your-docs tool.

I'm not trying to sell you anything — I'd genuinely value your take as someone who has sat through real architecture reviews. Would you be open to 10 minutes for me to show you what it does and hear whether it would have helped on <<RELEVANT PAST CONTEXT>>? Happy to work around your schedule.

Thanks either way,
<<SENDER_NAME>>
```

### Follow-up bump (once, after 5–7 business days)

```
Hi <<FIRST_NAME>> — following up in case this got buried. No pressure at all; if a 10-minute look isn't useful right now, no worries. If it is, here's a link to grab time: <<CALENDAR_LINK>>.

<<SENDER_NAME>>
```

### Persona-flavored openers (optional)

| Persona | Opener swap |
| --- | --- |
| Architecture lead | "It replaces ad hoc review documentation with a structured, defensible package built from evidence you already have." |
| CTO / VP Engineering | "It gets you evidence-backed reviews in a fraction of the time, with an audit trail your board and auditors can actually read." |
| GRC / Compliance | "It adds a pre-commit governance gate and a structured audit trail aligned to policy packs — built for exactly the gap you flagged." |
| Cloud consultant | "I built it as delivery infrastructure — bring your own evidence, produce a whitelabel report — thought it might be relevant to how you deliver review engagements." |

Track 20 sends privately (contact, channel, date, response, outcome). Hand positives to **M-19** via [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md).

---

## Related

- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) — canonical sponsor story; keep aligned
- [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md) — named SKUs to use in talk tracks
- [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) — follow-up SOW template
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — M-17/M-18/M-19/M-34 alignment
- [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) — persona map and qualification
