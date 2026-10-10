> **Scope:** Appendix D scaffold for the book draft *Managing Azure Security with AI*: the optional, owner-approved case study. Structure, sanitization rules, and method prose only; every fact about a real organization is an `[[OWNER: …]]` placeholder. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Appendix D — Case study: [[OWNER: working title, for example "Six weeks of paths in a regulated Azure estate"]]

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Sanitization check:** [`../tools/check_case_study.py`](../tools/check_case_study.py)

> *Draft status: scaffold. Not publishable until every `[[OWNER: …]]` placeholder is filled from the real engagement, every number has a row in the evidence register (section D.4), the approval checklist (section D.1) is complete, and `check_case_study.py --publish` passes.*

The chapters teach with Contoso, a fictional estate built to make each point cleanly. Real estates don't cooperate like that. This appendix follows one real engagement from the first collection to the last verification, and shows where the method held up, where it needed adjusting, and what the organization did with the results.

It's held to the book's own rules. Every claim about the organization's estate is labelled by how it's known, every number has a source in the evidence register, and anything that couldn't be determined says so. A case study that asked readers to take its numbers on trust would undo the argument of the eleven chapters before it.

---

## D.1 Approval and sanitization

This section is a checklist for the author. Remove it before submission, keeping only the one-paragraph note on how the case was sanitized (section D.11).

### Approval

- [ ] Written permission from the organization to publish a sanitized account, naming the reviewer who approved the final text. [[OWNER: approver role and date; keep the signed copy outside this repository]]
- [ ] The organization's reviewer has read the final text, including the evidence register's descriptions (not the underlying data).
- [ ] Legal review by the publisher, and by the organization if it asks.
- [ ] Decision recorded on whether the organization is named, described, or anonymous. The default is described: an industry and a size band, never a name.
- [ ] If any product, including the author's own, appears in the case: the publisher's conflict-of-interest guidance is followed, and the product appears only in a clearly marked sidebar (section D.10).

### What never appears

These are errors, and `check_case_study.py` fails on the ones it can detect:

- Tenant IDs, subscription IDs, object IDs, and any other GUIDs.
- Real domain names, including `*.onmicrosoft.com` tenant domains and named service endpoints such as `<account>.blob.core.windows.net`.
- Real public IP addresses. Use the documentation ranges (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) if an address is needed at all.
- Names of people, and email addresses outside `example.com`.
- Real resource, group, and application names. Rename them with a mapping kept outside the repository.
- Customer data, or anything read from a data store. The method never needed it, and the case study doesn't either.
- Screenshots of non-public user interfaces.
- Proprietary material from any vendor, including the author's: ranking rules, weights, rule version strings, internal designs, schemas, code, and backlog identifiers (README, IP boundary).

### What needs judgment

These are flagged for review, not failed automatically:

- **Exact counts.** "3,914 role assignments" can help identify an organization. Round to a stated precision ("about 3,900") or give a band, and say in section D.11 that you did.
- **Dates.** Shift the engagement's dates by a fixed offset, or give durations only ("week 1", "week 6"). Keep the intervals real, because the case study's point depends on them.
- **Private address ranges.** `10.x` ranges reveal less than public ones, but a full addressing plan reveals topology. Keep only what a point needs.
- **Unusual details.** A distinctive incident, an unusual Azure feature, or a named regulator can identify an organization on its own. Ask the organization's reviewer specifically about these.

### How to sanitize

1. Export nothing from the engagement into this repository. Work from the engagement's own reports and snapshots, in the organization's environment or a store it controls.
2. Build a rename map (real name → case study name) outside the repository, using neutral names in the same style as the book's Contoso names. Apply it consistently, so a reader can follow one identity across sections.
3. Write each number into the evidence register (section D.4) with its source *before* writing it into the prose.
4. Run `python docs/book/tools/check_case_study.py docs/book/appendices/d-case-study.md` after every editing session, and with `--publish` before the text leaves the repository. CI runs the draft-mode check on every pull request, so a prohibited identifier can't merge, but only the `--publish` run catches unfilled placeholders.

---

## D.2 The organization

[[OWNER: two or three sentences: industry, size band (people, not revenue), regulatory context in general terms, and why Azure security mattered to them at the time]]

| Attribute | Value | How known |
|-----------|-------|-----------|
| Industry | [[OWNER]] | Human assertion |
| Size band | [[OWNER: for example "2,000–5,000 employees"]] | Human assertion |
| Azure footprint | [[OWNER: subscriptions as a band, management group depth, regions]] | Observed fact (first snapshot) |
| Entra tenant | [[OWNER: users and applications, as bands]] | Observed fact (first snapshot) |
| Security tooling already in place | [[OWNER: categories only, for example "a cloud security posture tool and a SIEM"]] | Human assertion |
| Team doing the work | [[OWNER: roles and number of people]] | Human assertion |

---

## D.3 The question that started it

[[OWNER: the trigger, in the organization's own terms. Examples of the kind of thing to describe: an audit finding, a near miss, a board question, a posture score that stopped moving, a merger]]

Chapter 1 argued that checklists answer "is this setting wrong?" and that the question people actually need answered is "who can reach what?". Every engagement starts from the first question, because that's what existing tools report. The useful part of this one is how the organization moved from one to the other:

[[OWNER: the moment the question changed, ideally a specific finding that a checklist rated low and a path showed was serious, or the reverse]]

---

## D.4 Evidence register

Every number and every factual claim about the estate in this appendix appears here first. The prose cites rows by ID, the same way Chapter 7's summaries cite pack items.

| ID | Claim | Category | Source | Precision |
|----|-------|----------|--------|-----------|
| E1 | [[OWNER: for example "First collection read 41 of 47 expected subscriptions"]] | Observed fact | [[OWNER: snapshot ID or report, held by the organization]] | [[OWNER: exact / rounded / band]] |
| E2 | [[OWNER]] | [[OWNER]] | [[OWNER]] | [[OWNER]] |
| E3 | [[OWNER]] | [[OWNER]] | [[OWNER]] | [[OWNER]] |

Rules for the register:

- **Category** uses Chapter 2's labels: observed fact, derived fact, deterministic inference, AI inference, human assertion.
- **Source** names the artifact, not its content. "Snapshot 2025-…-prod, `role-assignments.json`" is a source. The file itself stays with the organization.
- **Precision** says whether the published number is exact, rounded, or a band, so section D.11 can describe the sanitization honestly.
- A claim with no source doesn't go in the prose. If it matters, it goes in as a human assertion, attributed to a role.

---

## D.5 Collection: the first snapshot

**Chapter 3 in practice.**

[[OWNER: how the collector ran: identity type, permissions granted, where it ran, how long the first full run took (E-row)]]

The first collection is where most engagements learn the size of the gap between "the subscriptions we have" and "the subscriptions we can read". [[OWNER: the expected-versus-read result (E-row), where the expected list came from, and who asserted it]]

| Gap | Kind (Chapter 3) | Effect on paths | Resolved? |
|-----|------------------|-----------------|-----------|
| [[OWNER]] | [[OWNER: scope not readable / API not permitted / partial result / not collected by design / stale]] | [[OWNER]] | [[OWNER: when and how, or "no"]] |

What to bring out in this section, from the engagement's notes:

- [[OWNER: any trap from Chapter 3 the team hit in practice: absent properties, role-definition joins, paging, application vs service principal IDs]]
- [[OWNER: anything the permissions review turned up, such as the collector needing a permission the security team hadn't expected to grant]]

---

## D.6 Paths

**Chapters 4 and 5 in practice.**

[[OWNER: the headline result in one or two sentences, cited to the register: how many paths to how many high-consequence targets, through how many convergence points]]

Describe the three to five paths that best show something. Use the case study's renamed identities and resources, and the same table shape as Chapter 7's evidence pack:

| Path | Entry point | Converges on | Target class | Weakest hop | Confidence |
|------|-------------|--------------|--------------|-------------|------------|
| P1 | [[OWNER]] | [[OWNER]] | [[OWNER: for example "customer records"]] | [[OWNER: hop and its evidence category]] | [[OWNER]] |
| P2 | [[OWNER]] | [[OWNER]] | [[OWNER]] | [[OWNER]] | [[OWNER]] |
| P3 | [[OWNER]] | [[OWNER]] | [[OWNER]] | [[OWNER]] | [[OWNER]] |

Questions this section should answer:

- Where did the paths converge, and was the convergence point one the organization already knew was sensitive? [[OWNER]]
- Which entry point surprised people most? In Contoso it was the help desk role; in real estates it's often an old automation identity, a group with an inherited role, or a federated credential with a broad subject. [[OWNER]]
- What did network evidence change (Chapter 5)? Did any path turn out to be reachable only from places that don't exist, or from far more places than expected? [[OWNER]]
- What did the search get wrong at first, and how was it found? Real derivations have bugs, and the snapshot-first design is what made them cheap to fix (Chapter 3, section 3.5). [[OWNER]]

---

## D.7 Flows and observation

**Chapter 6 in practice.**

[[OWNER: which targets had read logging when the engagement started, and from when (E-rows)]]

The honest answer to "has any of this been used?" was almost certainly "can't be determined" for some targets. Say which, and what the organization did about it:

- [[OWNER: targets with logging, and what the logs showed, in the past tense with a window]]
- [[OWNER: targets without logging, and whether logging was turned on during the engagement]]
- [[OWNER: how many paths turned out to be excess capability once owners confirmed the intended flows (E-row), and how long confirmation took]]

If shared keys or SAS tokens were in use on a target, this is the section where attribution failed. [[OWNER: what the logs could and couldn't say]]

---

## D.8 Where AI helped, and where it didn't

**Chapters 7 and 8 in practice.**

Report only what was measured. Chapter 7, section 7.11, lists the measures. If one wasn't tracked, say that, rather than estimating it.

| Measure | Result | Source |
|---------|--------|--------|
| Validator pass rate on first attempt | [[OWNER, or "not measured"]] | [[OWNER: E-row]] |
| Human edit rate, by audience | [[OWNER, or "not measured"]] | [[OWNER: E-row]] |
| Time to a sendable artifact, versus the manual baseline | [[OWNER, or "not measured"]] | [[OWNER: E-row]] |
| Errors found after sending | [[OWNER]] | [[OWNER: E-row]] |

Then the qualitative account:

- **The most useful output.** [[OWNER: in the chapters' experience it's usually the audience translations (Chapter 7, section 7.6). Say whether that held]]
- **The most instructive failure.** [[OWNER: a specific draft that a check caught, or one that got through and was found later: what it said, which check caught it or should have, and what changed afterwards]]
- **Untrusted text.** [[OWNER: did the derivation's instruction-pattern scan (Chapter 8, section 8.5) find anything in the real estate? Tags, display names, and descriptions written for an AI are themselves a finding]]
- **Review fatigue.** [[OWNER: how review volume was managed, and whether planted errors were used (Chapter 8, section 8.8)]]

---

## D.9 Remediation and verification

**Chapters 9 and 10 in practice.**

[[OWNER: which cut points were chosen, and why those over the alternatives. Ranking is described by its factors in general terms, never by any tool's rules or weights]]

| Change | Paths it was meant to close | Verified? | Postcondition result |
|--------|-----------------------------|-----------|----------------------|
| [[OWNER]] | [[OWNER]] | [[OWNER: verified / not verified / partially]] | [[OWNER: from the next snapshot, cited]] |

Three things to report plainly, because they're what Chapter 10 is about:

- **Changes that didn't verify.** [[OWNER: a fix that was reported done and wasn't, and how the snapshot showed it]]
- **New paths.** [[OWNER: any path the remediation itself created, and how it was found]]
- **Risk acceptances.** [[OWNER: paths deliberately left open, with the compensating controls and the expiry recorded]]

[[OWNER: the before-and-after, as Chapter 10's outcome measures: paths to high-consequence targets, convergence points, gaps, all cited]]

---

## D.10 Sidebar: the tooling used

> **Disclosure.** [[OWNER: if the author has a financial interest in any tool used in this engagement, state it here in one sentence]]
>
> [[OWNER: the tools used, described by what they did in this engagement, in terms of the book's method: collection, derivation, explanation, verification. Public behavior only. No internal design, ranking rules, weights, schemas, or version strings. No comparison with competing products. If the engagement used only the techniques in this book, say so and delete the rest of this sidebar]]

The rest of the appendix describes the method, not a product. A reader should be able to repeat everything in sections D.5 to D.9 with the queries in Appendix B and the code in the chapters.

---

## D.11 What this case does and doesn't show

**How this account was sanitized.** Names of the organization, its people, and its resources have been changed. [[OWNER: counts are rounded to … / given as bands; dates are shifted / given as durations]]. Every number in the text has a row in the evidence register, and its source has been checked by the author against the organization's records. The organization's reviewer approved the final text.

**What it shows.** That the method in this book can run end to end on a real estate of this size, with these permissions and this team. [[OWNER: one or two specific outcomes that the evidence register supports]]

**What it doesn't show.** One engagement is one data point. It doesn't show that the results generalize to other organizations, other estate sizes, or other teams, and it shouldn't be read as a benchmark. The organization agreed to be written about, which may itself make it unusual: organizations whose engagements went badly are less likely to approve a case study. And the author was involved in the work, which is a reason to weigh the account with the same care the book asks you to apply to any other single source.

**What we'd do differently.** [[OWNER: three or fewer concrete changes, each tied to a chapter, for example "collect directory role eligibility from the first run, not week 3 (Chapter 4, Rule 5)"]]

---

## D.12 Interview guide for filling the placeholders

Use these questions with the people who did the work. Record answers outside the repository, then write them into the register before the prose.

**Platform and identity team**

1. What did the collector's identity hold on day one, and what did you have to add? Who approved each addition?
2. Where did the expected subscription list come from, and how wrong was it?
3. Which path surprised you most, and why hadn't existing tools shown it?
4. Which change was hardest to make, and what made it hard: technical risk, ownership, or politics?

**Security team**

5. Which finding did a checklist rate low that a path showed was serious? Which was the reverse?
6. What did the first summary sent to leadership say, and how was it received?
7. Which generated draft would you have been embarrassed to send, and what caught it?
8. What did you decide not to fix, and what did you record about that decision?

**Leadership**

9. What decision did the work let you make that you couldn't make before?
10. What would you tell a peer considering the same approach?

**Everyone**

11. What did the method get wrong, or make harder than it needed to be?
12. Is there anything in this account that would identify the organization to someone in your industry?

---

## D.13 If approval doesn't come

The outline marks this appendix as optional, and the book stands without it. Three options, in order of preference:

1. **Drop it.** The chapters and the lab carry the argument. A missing case study costs some credibility with practitioners who want proof from a real estate. A weak or unapproved one costs more.
2. **Publish a short field note instead.** One or two pages on a single, approved observation (for example, the expected-versus-read gap on a first collection), with its own evidence rows. Less identifying, and easier to approve.
3. **A composite case**, assembled from several engagements, clearly labelled as a composite in its title and first paragraph. This is the weakest option, because a composite can't be checked against any one organization's records, and it should never be presented as a single engagement.

[[OWNER: decision and date]]

---

## Author notes (remove before submission)

- Everything in sections D.2 to D.10 that isn't a placeholder is method prose derived from the chapters. It's safe to keep as written, but re-read it once the facts are in, because real engagements rarely follow the chapter order exactly. Reorder sections D.5 to D.9 to match what actually happened if that tells the story better.
- Run `python docs/book/tools/check_case_study.py docs/book/appendices/d-case-study.md` while drafting. With `--publish`, it also fails on any remaining `[[OWNER` placeholder.
- The checker can't detect real resource names, people's names, or identifying details. Those depend on the rename map and the organization's reviewer.
- Re-read the README's IP boundary table against the finished appendix, especially section D.10.
- Target length once filled: about 4,000 words. The scaffold is shorter because placeholders stand in for most of the facts.
