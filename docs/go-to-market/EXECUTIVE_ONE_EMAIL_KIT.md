> **Scope:** Go-to-market — one-email sponsor/procurement kit (copy-paste blocks); not a second buyer narrative, price sheet, or legal commitment.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Executive one-email kit

**Audience:** Sponsor or procurement contact who needs a **single outbound email** with a tight summary and a short vendor-evidence checklist.

**Rules:** Summary claims are grounded only in **[V1_SCOPE.md](../library/V1_SCOPE.md)** and **[POSITIONING.md](POSITIONING.md)**. **No list prices** here — commercial list language stays single-sourced in **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)**.

---

## 1. Subject line options (copy one)

### Pilot closeout (after first commit) — TB-235

**Outcome-first:**

```
ArchLucid pilot results — <<PILOT_OUTCOME>> (review findings attached)
```

**Urgency-light:**

```
When you have 30 minutes — ArchLucid architecture review findings
```

**Meeting-request:**

```
Schedule 30 minutes: walkthrough of our ArchLucid pilot findings
```

### Procurement / evaluation (pre-pilot)

```
ArchLucid pilot — executive summary and evidence requests
```

```
Request: V1 scope summary for Architecture Proof Engine evaluation
```

```
Architecture review automation — vendor briefing (ArchLucid V1)
```

---

## 2. Pilot closeout email (~120 words, paste into body)

Use after a committed pilot run when closing the executive sponsor.

```
Subject: (pick a subject line from §1 — pilot closeout)

Hello <<SPONSOR_NAME>>,

We completed an ArchLucid architecture review pilot on our <<SYSTEM_NAME>> context. <<PILOT_OUTCOME>>

ArchLucid turns a structured architecture request into governed findings, a versioned manifest, and downloadable artifacts—every recommendation traced, every decision recorded. This is not a chat transcript; it is an evidence package your ARB or audit team can replay.

I have attached our executive brief, first-value report, proof packet, and ROI context. Could we schedule 30 minutes this week to walk through the findings and decide on next steps?

Thank you,
<<SENDER_NAME>>
```

**Attach these four artifacts:**

1. **Executive Sponsor Brief** — export or PDF from [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) (canonical sponsor narrative).
2. **First-value report PDF** — `GET /v1/pilots/runs/{runId}/first-value-report.pdf` for the committed run.
3. **Pilot proof packet ZIP** — `.\scripts\collect-first-pilot-proof.ps1 -RunId <guid>` (buyer-safe, mode-labeled bundle).
4. **ROI estimate context** — [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §5 benchmark table (label sources per proof packet).

**Follow-up timing:**

- **48 hours** after send: short bump if no reply ("Happy to reschedule the 30-minute findings walkthrough").
- **5 days** after send: second follow-up with one concrete finding headline from the manifest (no new claims beyond proof packet).

---

## 3. Executive summary (~120 words, paste into body) — procurement / evaluation

```
ArchLucid V1 is a bounded product contract for AI-assisted architecture work: architects submit a structured request, execute the analysis pipeline, and finalize a versioned architecture package with reviewable artifacts. V1 includes the core pilot path plus Operate layers—compare and replay, knowledge-graph views, advisory and ask, governance with policy packs, typed audit logging, and alerts—where configuration allows. We position ArchLucid as an Architecture Proof Engine for leaders who need explainable, governed outcomes with a durable evidence trail, not disposable chat. Reference deployments are Azure-native per published architecture intent. For shipped-versus-deferred capability detail rely on the linked V1 scope and positioning pages; list pricing language is maintained only in our pricing-philosophy document.
```

**Grounding (paste below the paragraph if the recipient wants URLs):**

- V1 capability boundary: `docs/library/V1_SCOPE.md` (repository) — or browse from your vendor’s doc index.
- Positioning aligned to shipped scope: `docs/go-to-market/POSITIONING.md`.
- Single-source commercial framing (**no alternate price sheets**): `docs/go-to-market/PRICING_PHILOSOPHY.md`.

---

## 4. Ask the vendor for these four artifacts

Use this as a procurement checklist (adjust tone for your process):

1. **Trust Center index** — consolidated security and procurement posture with honest status labels: **[trust-center.md](trust-center.md)** (public site **`/trust`** when deployed).
2. **Downloadable evidence pack (ZIP)** — anonymous, on-demand bundle of questionnaires, self-assessment, subprocessors, and related artifacts (documented on the Trust Center): **`GET https://api.archlucid.net/v1/marketing/trust-center/evidence-pack.zip`** (see Trust Center § “Download the evidence pack”).
3. **Pilot ROI measurement companion** — how to judge pilot success with **today’s** product: **[PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md)**.
4. **Proof-of-value snapshot playbook** — how to assemble timing, load-test summaries, ROI deltas, and explainability signals into one evidence narrative: **[PROOF_OF_VALUE_SNAPSHOT.md](../library/PROOF_OF_VALUE_SNAPSHOT.md)**.

**Canonical sponsor story of record** (if they need narrative before metrics): **[EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md)**.

---

## Related

- **[EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md)** — dominant outward buyer narrative
- **[INTEGRATION_CATALOG.md](INTEGRATION_CATALOG.md)** — technical integration surface (separate from this email)
