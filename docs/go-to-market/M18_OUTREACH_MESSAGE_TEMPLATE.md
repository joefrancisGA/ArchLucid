> **Scope:** M-18 deliverable — outreach message templates for the founder-led "20 warm contacts" campaign. Companion to [`M-17`](GTM_BACKLOG.md) (build the list) and feeds [`M-19`](GTM_BACKLOG.md) (run the demos). **Not** a second buyer narrative — every claim here traces to [`ELEVATOR_PITCH.md`](ELEVATOR_PITCH.md) and [`POSITIONING.md`](POSITIONING.md); guardrails from [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) apply.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# M-18 — Outreach message templates

**Task:** `M-18` — send 20 outreach messages to the list built in `M-17` (LinkedIn network, former colleagues), offering a 10-minute demo + feedback call. **Explicitly not a sales pitch** — the ask is for the recipient's professional opinion, not a purchase decision.

**Drafted by:** coding agent (Sonnet-tier copy drafting), 2026-07-03. **Owner action required:** personalize each send (bracketed fields), pick channel per contact, send, and log outcomes in §5. Sending itself is a human-only step (real LinkedIn/email accounts, real relationships) — this document only prepares the copy.

---

## 1. Framing rules (read before sending)

- **Ask for feedback, not a sale.** The explicit ask is "10 minutes to react to what I built" or "tell me if this would have helped you," not "buy this."
- **Personalize every send.** Reference something specific and true about the relationship (a former team, a shared project, a post they made) — do not send an identical block message to all 20.
- **One send per contact, one bump.** Send once; if no reply after 5–7 business days, one short bump (§4). No third message. Respect silence as "no."
- **Ground every claim in shipped V1 scope.** Use only the pain-led one-liner and category line from [`POSITIONING.md`](POSITIONING.md) §1 and the 30-second pitch in [`ELEVATOR_PITCH.md`](ELEVATOR_PITCH.md). Do not promise anything in [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)'s "do not promise" column (no named-customer results, no live self-serve checkout, no V1.1-only capability framed as shipped-for-you-today).
- **No mass BCC / obvious templating.** Send individually. If using a CRM/sequencer, keep the merge fields visibly personal (name, specific shared context) — a generic-looking blast reads as spam to a warm contact and burns the relationship for `M-19`/`M-38` follow-on asks.
- **Avoid disqualified segments from the outreach list.** Per [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) §1.3, do not target contacts at employers with an active conflict or under an NDA that would make this an improper solicitation (already an `M-17` list-building constraint; re-check before sending).

---

## 2. LinkedIn connection-request note (≤300 characters)

Use only for 2nd/3rd-degree contacts you are not yet connected to. LinkedIn enforces a hard character limit on the note — keep it short and specific.

```
Hi <<FIRST_NAME>> — <<SHARED_CONTEXT, e.g. "saw your post on architecture review debt" / "we worked together at <<COMPANY>>">. I built a tool for evidence-backed architecture reviews and would value 10 minutes of your take. Would love to connect.
```

**When to use:** contacts you know of but are not yet connected to on LinkedIn.

---

## 3. Warm outreach message (1st-degree connections, former colleagues)

Use this as the primary M-18 message — the target audience per `M-17` is your existing network, so most sends should use this warmer, longer version rather than the connection-request note.

```
Hi <<FIRST_NAME>>,

<<PERSONALIZED_OPENER — one sentence referencing the real shared context: former team, a project you worked on together, a recent post/role change.>>

I've been heads-down building ArchLucid — it turns architecture review from scattered opinion into an evidence-backed decision package: findings prioritized, evidence cited, decisions recorded, with an exportable report your ARB or auditor can actually follow. Not another chat-with-your-docs tool.

I'm not trying to sell you anything — I'd genuinely value your take as someone who has sat through real architecture reviews. Would you be open to 10 minutes for me to show you what it does and hear whether it would have helped on <<RELEVANT PAST CONTEXT, if applicable — e.g. "the migration we worked on at <<COMPANY>>">? Happy to work around your schedule.

Thanks either way,
<<SENDER_NAME>>
```

**When to use:** default template for the `M-17` list — 1st-degree LinkedIn connections, former colleagues, and personal-network contacts.

**Timing:** aim for 45–60 seconds to read aloud; keep total length close to the draft above so it reads as a real message, not a mini-pitch deck.

---

## 4. Follow-up bump (send once, only if no reply after 5–7 business days)

```
Hi <<FIRST_NAME>> — following up in case this got buried. No pressure at all; if a 10-minute look isn't useful right now, no worries. If it is, here's a link to grab time: <<CALENDAR_LINK>>.

<<SENDER_NAME>>
```

**Rule:** send at most once. If there is still no reply, move the contact to "no response" in the tracking log (§5) and do not send a third message.

---

## 5. Persona-flavored openers (optional — swap into §3's second paragraph)

Match the opener to the recipient's role using the persona map from [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) §2. Keep the rest of the template unchanged.

| Persona | Opener line to use in place of the generic pitch sentence |
| --- | --- |
| **Architecture lead** (Principal Architect, Head of Architecture) | "It replaces ad hoc review documentation with a structured, defensible package built from evidence you already have." |
| **CTO / VP Engineering** | "It gets you evidence-backed reviews in a fraction of the time, with an audit trail your board and auditors can actually read." |
| **GRC / Compliance lead** (CISO, Compliance Manager) | "It adds a pre-commit governance gate and a structured audit trail aligned to policy packs — built for exactly the gap you flagged." |
| **Cloud consultant / boutique firm** | "I built it as delivery infrastructure — bring your own evidence, produce a whitelabel report — thought it might be relevant to how you deliver review engagements." |

---

## 6. Outreach tracking log (fill in as you send)

Copy this table into your own tracker (or a scratch doc) and log all 20 sends. This feeds the qualification step in [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) §3 for anyone who responds positively, and gives `M-20` real objections to synthesize.

| # | Contact | Relationship | Channel (LinkedIn DM / connection note / email) | Template used | Date sent | Response | Outcome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | |
| 2 | | | | | | | |
| ... | | | | | | | |
| 20 | | | | | | | |

**Outcome values to use:** `Meeting booked` · `Positive, no meeting yet` · `Declined` · `No response` · `Disqualified (conflict/NDA)`.

---

## 7. Definition of done for M-18

- [ ] All 20 contacts from the `M-17` list have been sent a personalized message using §2 or §3.
- [ ] Any non-responders after 5–7 days received the §4 bump (once).
- [ ] The tracking log (§6) is filled in for all 20 sends.
- [ ] Positive responses are handed to `M-19` (live demo scheduling) using the qualification steps in [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) §3–§4.
- [ ] Any recurring objection or phrasing friction is captured for `M-20`, even before 5–10 demos are complete — do not wait to start the log.

Everything above the checklist is agent-drafted and ready to use. The checklist items themselves require a human to actually send messages to real contacts — no further agent work unblocks them.

---

## Related

- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — M-17 (build list), M-18 (this task), M-19 (run demos), M-20 (objection tracking)
- [`ELEVATOR_PITCH.md`](ELEVATOR_PITCH.md) — 30-second pitch (source for §2/§3 claims)
- [`POSITIONING.md`](POSITIONING.md) — tagline, category line, messaging do/don't
- [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) — claim guardrails
- [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) — persona map, qualification criteria, disqualifiers
