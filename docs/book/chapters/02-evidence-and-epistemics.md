> **Scope:** Chapter 2 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Chapter 2 — Evidence and epistemics

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 6,000–7,000 words. Facts about Azure behavior must be re-verified against Microsoft documentation before submission.*

---

## The report nobody could defend

A security team receives a report on a Monday morning. It says, in bold, near the top:

> **Critical:** An attacker who compromises the payments repository can exfiltrate customer records from the `custdata` storage account.

The report is well formatted. It has a diagram, a severity, and a recommended fix. The platform team's lead reads it and asks three questions:

1. Did someone actually exfiltrate data, or could they?
2. Which parts of this did the tool read from Azure, and which parts did it work out?
3. Who decided the storage account holds customer records?

Nobody in the room can answer. The tool that produced the report blended what it read, what it computed, what a model guessed, and what someone typed into a spreadsheet last year into one confident sentence. The sentence may even be true. But because nobody can tell which parts are solid, the team can't defend it to the platform lead, an auditor, or the CISO. Within a week it's argued down to "medium" and parked.

This chapter is about preventing that outcome. The tool needs to be more than accurate. Every claim it makes should carry **how it is known**, so the people acting on it can judge it themselves.

That matters more once AI is involved. A language model is very good at turning a pile of evidence into one fluent paragraph, and that's exactly what makes it dangerous here. Fluency hides seams. If we want AI in our security workflow without making our reports less defensible, we need a vocabulary for the seams before the model ever sees the evidence.

The vocabulary is small: five categories of knowledge. The rest of the book uses it everywhere.

---

## 2.1 Why epistemics belongs in security tooling

*Epistemics* is the study of how we know what we know. It sounds academic, but every experienced incident responder already practices it. When a responder says "the logs show a sign-in from this IP" versus "I think this account was phished," they're making an epistemic distinction. One is an observation and the other is an interpretation. They write them down differently, they escalate them differently, and they'd be embarrassed to confuse them in a post-incident review.

Security tooling has historically been sloppier. Posture tools tend to present every finding in the same voice: a rule fired, so here is a finding. That was tolerable when findings were simple ("storage account allows public blob access") because the finding and the observation were nearly the same thing. It stops being tolerable when tools start reasoning across many facts to reach conclusions about paths, blast radius, and business impact. Every step of reasoning adds a place where the conclusion can diverge from reality.

There are three practical reasons to label how each claim is known:

**Defensibility.** A claim that can be traced to an API response survives scrutiny. A claim that can only be traced to "the tool said so" does not. When findings are challenged, and in a healthy organization they will be, labels let you defend the strong parts and concede the weak parts without losing the whole argument.

**Correct prioritization.** A path built entirely from observed facts deserves faster action than one that depends on a model's guess about what a storage account contains. Without labels, both look the same, and teams either over-react to guesses or under-react to facts.

**Safe use of AI.** If AI output is labeled as AI output at the moment it's produced, it can't quietly become "fact" three steps later when another component consumes it. Most AI failures in security tooling are not dramatic hallucinations. They are small, plausible guesses that lose their label as they move through a pipeline.

---

## 2.2 The five categories

Every claim a security analysis makes about an Azure environment falls into one of five categories. They're listed from most to least directly grounded in the environment itself, but they're not a simple ranking of "good" to "bad". Each has a proper use.

| Category | Short definition | Produced by |
|----------|------------------|-------------|
| **Observed fact** | Read directly from an authoritative source | An API call, a log record |
| **Derived fact** | Computed from observed facts by unambiguous rules | Deterministic code |
| **Deterministic inference** | A conclusion from rules that depend on assumptions | Deterministic code plus stated assumptions |
| **AI inference** | An interpretation produced by a model | A language model or other ML model |
| **Human assertion** | Something a person states to be true | A named person, with a date |

Each one is covered below.

### Observed fact

An **observed fact** is something you read directly from an authoritative source at a known time. In Azure, the authoritative sources are mostly the Azure Resource Manager (ARM) APIs, Azure Resource Graph, Microsoft Graph, and log stores such as the Activity Log and resource diagnostic logs.

Examples:

- Role assignment `ra-7f3…` grants the role **Contributor** to service principal `sp-payments-deploy` at the scope of resource group `rg-payments-prod`.
- Storage account `custdata` has the property `allowSharedKeyAccess` set to `true`.
- App registration `payments-deploy` has a federated identity credential whose subject is `repo:contoso/payments:ref:refs/heads/main`.

Three properties make something an observed fact:

1. **A source.** You can name the API or log it came from.
2. **A time.** It was true when read. Azure changes constantly, and an observed fact from last Tuesday is a historical observation today.
3. **No interpretation.** The claim restates what the source said. "Contributor at `rg-payments-prod`" is observed. "Has write access to everything in payments" is not, because that requires knowing what Contributor permits and what lives in the resource group.

Observed facts fail in a few predictable ways. Collection can be **incomplete**: your identity may not be allowed to read some subscriptions, and missing data looks exactly like absent data unless you record the gap. Collection can be **stale**: the snapshot is a day old and someone changed the assignment this morning. And the source itself can be **ambiguous**: some Azure properties have defaults that apply when the property is absent, so "not set" and "set to the default" read differently in the raw JSON. Chapter 3 covers collection in detail. For now, the rule is that **an observed fact always carries its source and its time, and a gap is recorded as a gap.**

### Derived fact

A **derived fact** is computed from observed facts using rules that have no meaningful ambiguity. If two competent engineers implemented the rule independently, they would get the same answer.

Examples:

- Because `sp-payments-deploy` holds Contributor at `rg-payments-prod`, and `custdata` lives in `rg-payments-prod`, the service principal holds Contributor on `custdata`. (RBAC inheritance from a parent scope to a child resource is defined behavior.)
- Because user `alice` is a member of group `payments-admins`, which is a member of group `platform-ops`, and `platform-ops` holds Reader on the subscription, `alice` effectively holds Reader on the subscription.
- The snapshot taken today differs from the snapshot taken yesterday by one added role assignment.

Derived facts are as strong as their inputs and the rule. They fail when the rule is wrong, which is more common than it sounds. Azure RBAC has deny assignments, conditions on role assignments, and data-plane versus control-plane distinctions. Entra group membership can be dynamic. A derivation that ignores any of these produces confident wrong answers. The discipline is to **write the rule down, test it, and keep the list of inputs it consumed** so anyone can retrace it.

A useful test: if a derived fact surprises someone, can you show them every observed fact it came from in under a minute? If not, it isn't functioning as a derived fact. It's functioning as an assertion by your tooling.

### Deterministic inference

A **deterministic inference** is a repeatable, rule-based conclusion that depends on at least one assumption the evidence does not prove. Same inputs, same answer, every time, but the answer is only as true as the assumption.

Examples:

- Contributor includes the action `Microsoft.Storage/storageAccounts/listKeys/action`. `custdata` allows shared key access. Therefore `sp-payments-deploy` **can obtain the account keys and read blob data**, *assuming* no deny assignment, network rule, or policy blocks the key-based data-plane request from wherever the attacker is operating.
- The storage account's network rules allow access from a subnet where a virtual machine runs. Therefore the VM **can reach** the storage endpoint, *assuming* no NSG, firewall, or route table blocks the flow.

The difference from a derived fact is the word *assuming*. The first example is a strong inference. The role definition really does include that action, and shared key access really is enabled. But the conclusion "can read blob data" depends on conditions the collected evidence may not cover: network restrictions evaluated at request time, a deny assignment you couldn't read, or a condition on the role assignment.

Deterministic inference is the workhorse of path analysis. Almost every interesting hop on an attack path is one. That's fine, as long as the assumptions are **stated, not implied**. A good inference record looks like this:

- **Conclusion:** `sp-payments-deploy` can read blob data in `custdata`.
- **Rule:** Contributor permits `listKeys`, and shared key access is enabled, so key-based data access is possible.
- **Inputs:** role assignment `ra-7f3…`, storage property `allowSharedKeyAccess = true`, role definition for Contributor.
- **Assumptions:** no deny assignment applies; storage network rules permit the caller's network location; no role assignment condition restricts the action.
- **Assumptions checked:** deny assignments — read, none found; network rules — read, public network access enabled from all networks; conditions — read, none.

When the assumptions have been checked against evidence, the inference gets stronger. When they haven't, the record says so. Either way, a reviewer can see exactly what would have to be false for the conclusion to be wrong.

### AI inference

An **AI inference** is an interpretation produced by a model. That includes a large language model answering a question, a classifier labeling a resource, or an embedding search deciding two things are similar. The defining property is that **the same inputs may not produce the same output, and the reasoning cannot be fully retraced.**

Examples:

- "Storage account `custdata` probably holds customer personal data." (Inferred from its name, tags, and the names of its containers.)
- "This path is likely to be exploited because the repository is public and active." (A judgment about attacker behavior.)
- A paragraph explaining the attack path to an executive.

AI inferences are useful. Names, tags, and descriptions really do carry signal, and a model that reads `custdata`, a container called `exports-gdpr`, and a tag `dataClass: confidential` is probably right that this is sensitive data. Models are also far better than rules at turning a twelve-hop path into an explanation a human can read.

They fail in ways that are hard to see:

- **Plausible invention.** The model states a fact that sounds right and isn't, such as a role name that doesn't exist or a permission that a role doesn't include.
- **Silent upgrade.** The model reads "can read blob data" and writes "has accessed customer data." The verb changed; the evidence didn't.
- **Instruction leakage.** The model treats text inside the evidence, such as a resource description, as an instruction. Chapter 8 covers this attack.
- **Unwarranted precision.** The model says "high likelihood (85%)". Nothing calibrated produced that number.

The rule for AI inference is short: **an AI inference keeps its label for its whole life.** It doesn't become a derived fact because a deterministic component consumed it. It doesn't become an observed fact because it was written into a database. If a downstream rule depends on an AI inference ("if the account holds personal data, severity is critical"), the downstream conclusion inherits the AI label too. Section 2.4 makes this precise.

A corollary: **AI inferences about the environment should be about interpretation, not about facts the tooling could observe.** If the question is "does this role assignment exist?", ask the API, not the model. Use the model for questions where no API has the answer: what this data probably is, how to explain a path, what a reasonable remediation sequence looks like.

### Human assertion

A **human assertion** is something a named person states to be true. Humans know things no API exposes: which system holds the crown jewels, which team owns a subscription, whether a flagged path is intentional, that a break-glass account is monitored by a separate process.

Examples:

- "`custdata` holds production customer records." — asserted by Priya Shah, Data Protection Officer, 2026-09-14, expires 2027-03-14.
- "The Contributor assignment for `sp-payments-deploy` is required for current deployments." — asserted by the payments platform lead, 2026-10-01, expires 2026-12-31.

Human assertions are often the most important context in a report, and the most neglected. Three properties make them trustworthy:

1. **A named owner.** "The business says…" is not an assertion; it's a rumor. A person's name, or at minimum a role, makes the claim accountable.
2. **A date and an expiry.** Organizations change. Last year's crown jewel is this year's decommissioned system. An assertion without an expiry date becomes a permanent fact by neglect.
3. **A scope.** The assertion applies to a specific resource or set of resources, not "all storage in payments."

Human assertions also fail. People are wrong, guess under time pressure, and assert things outside their knowledge. The label doesn't make an assertion true. It makes it *attributable*, so that when it's wrong, the correction goes to the right person.

One more rule: **tooling must not invent human assertions.** If no one has said who owns a subscription, the owner field is empty. It is not filled with the most frequent deployer, the creator of the resource group, or a model's guess. Those are inferences and must be labeled as such. An empty field is honest; a plausible but invented owner sends the ticket to the wrong team and makes everyone trust the routing less.

---

## 2.3 Annotating a real path

Back to the Monday report. Here is the claim again:

> An attacker who compromises the payments repository can exfiltrate customer records from the `custdata` storage account.

Broken into hops, with each claim labeled:

| # | Claim | Category | Basis |
|---|-------|----------|-------|
| 1 | App registration `payments-deploy` trusts GitHub Actions tokens whose subject is `repo:contoso/payments:ref:refs/heads/main`. | Observed fact | Microsoft Graph, federated identity credentials, read 2026-10-06 09:12 UTC |
| 2 | Code merged to `main` in `contoso/payments` can run a workflow that obtains a token for `payments-deploy`. | Deterministic inference | Rule: a federated credential with this subject accepts tokens from workflows on that branch. Assumes: the workflow has `id-token: write` permission and branch protection can be bypassed or the attacker can merge. |
| 3 | `payments-deploy`'s service principal holds Contributor on resource group `rg-payments-prod`. | Observed fact | Azure Resource Graph, `authorizationresources`, read 2026-10-06 09:14 UTC |
| 4 | That service principal therefore holds Contributor on `custdata`. | Derived fact | RBAC scope inheritance; `custdata` is a child of `rg-payments-prod` (observed) |
| 5 | `custdata` allows shared key access. | Observed fact | Resource Graph, storage account properties, read 2026-10-06 09:14 UTC |
| 6 | The service principal can list the account keys and read blob data. | Deterministic inference | Rule: Contributor includes `listKeys`; shared keys enabled. Assumptions checked: no deny assignment (read), no role condition (read), public network access from all networks (read). |
| 7 | `custdata` holds customer records. | AI inference **and** human assertion | AI: inferred from account name, container names, and tags. Human: asserted by DPO, 2026-09-14, expires 2027-03-14. |
| 8 | An attacker **has exfiltrated** customer records. | **Not supported** | No storage read logs were collected. Diagnostic logging for blob reads is not enabled on `custdata` (observed). |

Laid out like this, the argument changes shape:

- The path is real and strong. Hops 1, 3, 4, and 5 are observed or derived. Hops 2 and 6 are inferences, and hop 6's assumptions have all been checked.
- Hop 2 is where the remaining uncertainty sits. Whether "compromises the repository" really means "can run a workflow on `main`" depends on branch protection and review rules that weren't collected. That's a specific, answerable question for the payments team.
- Hop 7 is stronger than it first looked, because a named person confirmed what the model guessed.
- Hop 8 is unsupported, and the evidence explains *why*: no read logs exist. The word "exfiltrate" has to come out of the headline. The honest headline is:

> **Critical:** Code merged to `main` in `contoso/payments` **can** read data in `custdata`, which the DPO has confirmed holds production customer records. We have no evidence about whether this access has been used, because blob read logging is not enabled.

That headline is harder to argue down than the original, because every phrase in it can be backed up. It also produces two extra actions the original didn't: confirm branch protection on `main`, and enable diagnostic logging on `custdata`.

---

## 2.4 How categories combine

A path, finding, or recommendation is built from many claims. What category does the *whole* thing belong to? Three rules cover almost every case.

### Rule 1: A conclusion is no stronger than its weakest required input

If a conclusion depends on several claims, and all of them are required, the conclusion inherits the weakest category among them. A path whose every hop is observed or derived, except one AI inference, is an AI-dependent path.

"Weakest" here means "least directly grounded," in this order:

```text
observed fact  >  derived fact  >  deterministic inference  >  AI inference
```

Human assertions sit outside that line, because their strength depends on who made them and how recently. In practice, treat a current, in-scope human assertion as roughly as strong as a deterministic inference, and an expired one as no evidence at all.

In code, the rule is a minimum over an ordered scale:

```python
from enum import IntEnum


class Evidence(IntEnum):
    # Higher value means more directly grounded in the environment.
    AI_INFERENCE = 1
    DETERMINISTIC_INFERENCE = 2
    DERIVED_FACT = 3
    OBSERVED_FACT = 4


def path_grounding(hops: list[Evidence]) -> Evidence:
    """A path is only as grounded as its least-grounded required hop."""
    if not hops:
        raise ValueError("A path must have at least one hop.")

    return min(hops)
```

Rule 1 is deliberately pessimistic. It means a single guess anywhere in the chain gets shown to the reader. That's what you want. The reader may still act on an AI-dependent path; they just know they're doing so.

### Rule 2: Categories never upgrade by passing through a component

When an AI inference is stored in a database, passed through a rules engine, or summarized by another model, it is still an AI inference. The same goes for every category. A deterministic component that reads an AI-inferred "sensitive data" flag and outputs "severity: critical" has produced a conclusion that depends on an AI inference.

This sounds obvious. In practice it's the most common way honest tooling becomes dishonest. A classifier writes `isSensitive = true` into a column. Six months later, a different team writes a rule that reads the column. Nobody remembers it was a guess. Store the category **next to** the value, not in documentation:

```json
{
  "resourceId": "/subscriptions/…/storageAccounts/custdata",
  "claim": "holdsCustomerPersonalData",
  "value": true,
  "evidence": "AI_INFERENCE",
  "producedBy": "classifier v3 (names, tags, container names)",
  "producedAt": "2026-10-06T09:20:00Z"
}
```

### Rule 3: Corroboration can raise confidence; repetition cannot

Two *independent* sources agreeing is meaningful. A model's guess that `custdata` holds personal data, plus a DPO's assertion that it does, is stronger than either alone. That's why hop 7 in the table above lists both.

Two *dependent* sources agreeing is not meaningful. If three models are each given the same container names and all say "personal data," you have one inference, not three. If a human asserts something because the tool's dashboard told them so, the assertion is an echo of the inference, not independent confirmation. When recording a human assertion, it's worth asking: "Did you know this before you saw our output?"

---

## 2.5 Confidence: ordinal, not numeric

Categories describe *how* a claim is known. Confidence describes *how sure* we are. Both are needed. An observed fact from a stale snapshot is less certain than a fresh one. A deterministic inference with every assumption checked is more certain than one with none checked.

The tempting way to express confidence is a percentage: "82% likely exploitable." Avoid it, for one concrete reason. **A percentage claims calibration.** It promises that, across all the claims you've labeled 82%, about 82% turned out true. Producing that number honestly requires a labeled history of outcomes and a model fitted against it. Almost no security tool has that for attack paths, because confirmed exploitation outcomes are rare, private, and inconsistently recorded.

Without calibration, a percentage is a guess formatted as a measurement. Readers treat it as a measurement anyway. They compare 82% to 79% and prioritize accordingly, which is meaningless.

Use a small set of **ordinal bands** with written definitions instead:

| Band | Definition |
|------|------------|
| **High** | Every hop is observed or derived, or is an inference whose assumptions have been checked against fresh evidence. |
| **Medium** | At least one hop is an inference with unchecked assumptions, or depends on a current human assertion. |
| **Low** | At least one required hop is an AI inference with no corroboration, or the evidence is stale. |
| **Insufficient evidence** | A required input couldn't be collected. The path may or may not exist. |

The exact definitions matter less than three properties: the bands are **few**, they are **defined in terms of evidence**, not gut feel, and readers can **reproduce** the band from the hop table. If someone asks "why is this medium?", the answer is a specific hop, not a model weight.

When you do eventually have outcome data, such as a red-team program that confirms or refutes paths, you can calibrate. Until then, ordinal bands are the honest choice.

> **A note for AI-generated text.** Models produce numeric confidence readily when asked, and sometimes when not asked. If a model's output will be shown to users, strip or reject numeric probabilities unless they came from a calibrated component. Chapter 8 shows how.

---

## 2.6 Gaps, unknowns, and the zero trap

Every real collection has gaps. The collection identity lacks Reader on two subscriptions. Microsoft Graph permissions weren't granted, so group membership is missing. A management group's deny assignments can't be enumerated. How a tool handles gaps decides whether its output can be trusted.

There are two common mistakes, and they point in opposite directions.

**Mistake 1: treating missing data as absent.** If group memberships weren't collected, the tool sees no path from Alice to the subscription and reports none. The report looks clean, and it's clean only because the tool couldn't see. This is the more dangerous mistake because it produces false reassurance.

**Mistake 2: treating unknown values as zero.** A path is scored on several dimensions, one of which is business impact. Nobody has asserted what the target resource holds, so business impact is "unknown." The scoring formula multiplies the dimensions together, unknown becomes 0, and a technically severe path drops to the bottom of the list. Call this the **zero trap**. It's common, because multiplication is the easiest way to combine scores and because "unknown" has to become a number somehow.

The fixes:

- **Record gaps as first-class results.** "Subscription `sub-legacy-03`: no read access; paths through this subscription unknown." Show gaps in the same view as findings, not in a log file.
- **Use "insufficient evidence" as an explicit state**, distinct from both "path exists" and "no path."
- **Rank on independent dimensions** (exposure, privilege, blast radius, business impact, confidence), and let unknown be unknown. A path with high exposure, high privilege, and unknown business impact should sort *above* a path with low exposure and known high impact, and the unknown should be flagged as a question for a human to answer.

The principle: **an unknown is a question, not a zero.**

---

## 2.7 Language: the words carry the category

Readers rarely look at labels. They read the sentence. So the sentence itself has to carry the category, which means choosing verbs carefully.

| If the evidence is… | Write… | Don't write… |
|---------------------|--------|--------------|
| Observed fact | "holds", "is configured to", "has" | "appears to", "may" (understates) |
| Derived fact | "effectively holds", "inherits", "therefore has" | "might have" |
| Deterministic inference | "can", "is able to", "can reach", plus the key assumption | "will", "does", "has accessed" |
| AI inference | "likely", "probably", "appears to" plus "(AI-inferred)" | "is", "contains" |
| Human assertion | "according to [name/role], [date]" | the bare claim |
| No evidence | "we have no evidence whether…" | silence, or the most alarming verb |

The most important row is deterministic inference. Most attack-path conclusions are capabilities: someone **can** do something. Capability is serious. It's the whole reason to fix the path. But it is not activity. "Can read" is not "read." "May reach" is not "reached." "Could exfiltrate" is not "exfiltrated." Executives and auditors make very different decisions based on that difference. Treat a slip from capability to activity as a factual error, not a style issue.

This is also where AI-generated explanations most often go wrong. Models write fluent prose, and fluent prose prefers active, concrete verbs. Left alone, a model will turn "the service principal can list keys" into "the service principal uses its keys to access the data." The fix is partly prompting (Chapter 7) and partly checking output mechanically for activity verbs that the evidence doesn't support (Chapter 8).

---

## 2.8 Putting it together: an evidence record

Everything in this chapter fits into one small record per claim. You don't need a specific product for this. A JSON file, a database table, or a spreadsheet works, as long as each claim carries these fields:

| Field | Purpose |
|-------|---------|
| `id` | Stable identifier referenced by other records' `inputs` |
| `claim` | The statement, in plain language |
| `category` | One of the five categories |
| `source` | API, log, rule name, model and version, or person |
| `observedAt` / `assertedAt` | When it was true or stated |
| `expiresAt` | Required for human assertions; optional for others |
| `inputs` | IDs of the claims this one was built from (for derived facts and inferences) |
| `assumptions` | For inferences: what must hold, and whether each was checked |
| `confidence` | Ordinal band |

The `inputs` field matters most. It turns a report into a graph of claims you can walk backwards. When the platform lead asks "why do you think that?", you follow `inputs` until you reach observed facts and human assertions, and that chain is the answer.

---

## 2.9 Lab: annotate a path, then grade the model

This lab uses no special tooling. It builds the habit the rest of the book depends on.

**Setup.** Use the companion lab tenant (Appendix A) or any Azure subscription where you hold Reader. Pick one path you suspect exists, ideally from a CI/CD identity to a data store. If you don't have one, use the payments example from section 2.3 as written.

**Step 1 — Collect.** For each hop, record the observed facts with source and timestamp. Use Azure Resource Graph for role assignments and resource properties, and Microsoft Graph for federated credentials and group memberships. Record anything you couldn't read as a gap.

**Step 2 — Annotate.** Build the hop table from section 2.3 for your path. For every inference, write its assumptions and mark which ones you checked.

**Step 3 — Compute.** Apply Rule 1 to get the path's overall grounding, and assign a confidence band using the definitions in section 2.5.

**Step 4 — Ask a model.** Give a language model the hop table as structured data and this instruction:

```text
Explain this access path to a security director in under 150 words.
Use only the hops provided. After each sentence, cite the hop number(s)
it depends on in square brackets. Do not state that any access has
occurred unless a hop explicitly records observed access.
```

**Step 5 — Grade.** For each sentence of the model's answer, check:

1. Does it cite at least one hop?
2. Does the cited hop actually support the sentence?
3. Did any verb upgrade capability to activity ("can read" → "accessed")?
4. Did the model introduce a number, name, or fact not in the table?

Run the same prompt three times. Note how the answers differ. That variation is the practical meaning of "AI inference": same inputs, different outputs.

**What you should see.** In most runs, the model explains the path well and cites most sentences. In some runs, it will upgrade a verb or add a plausible detail that isn't in the evidence. That gap between "usually right" and "always traceable" is the subject of Chapters 7 and 8.

---

## Summary

- Every claim about an environment is one of five kinds: **observed fact, derived fact, deterministic inference, AI inference, or human assertion**.
- Observed facts carry a **source and a time**; gaps are recorded, not hidden.
- Derived facts and inferences carry their **inputs**; inferences also carry their **assumptions**, checked or not.
- AI inferences **keep their label for life** and should be used for interpretation, not for facts an API can provide.
- Human assertions need a **named owner, a date, an expiry, and a scope**. Tooling never invents them.
- A conclusion is **no stronger than its weakest required input**. Categories never upgrade by passing through a component. Independent corroboration can raise confidence, but repetition can't.
- Use **ordinal confidence bands** defined in terms of evidence. A percentage claims a calibration you probably don't have.
- **An unknown is a question, not a zero.**
- Verbs carry the category. **"Can" is not "did."**

## Key terms

- **Observed fact** — a claim read directly from an authoritative source at a known time.
- **Derived fact** — a claim computed from observed facts by an unambiguous rule.
- **Deterministic inference** — a repeatable conclusion that depends on stated assumptions.
- **AI inference** — an interpretation produced by a model; not guaranteed repeatable or traceable.
- **Human assertion** — a claim attributed to a named person, with a date, expiry, and scope.
- **Gap** — evidence that could not be collected; reported explicitly.
- **Zero trap** — treating an unknown value as zero in a score, hiding real risk.
- **Ordinal confidence band** — a small, defined set of confidence levels (for example High / Medium / Low / Insufficient evidence) used instead of uncalibrated percentages.

---

## Author notes (remove before submission)

- Verify against current Microsoft docs: Contributor's inclusion of `Microsoft.Storage/storageAccounts/listKeys/action`; `allowSharedKeyAccess` default behavior; federated credential subject format for GitHub Actions; `authorizationresources` table coverage of role assignments, deny assignments, and conditions.
- Consider a sidebar on Microsoft Entra ID sign-in and audit logs as an "observed activity" source, cross-referenced to Chapter 6.
- Possible figure: the hop table from 2.3 rendered as a diagram, with a different line style per evidence category.
- Running example (payments → `custdata`) should be reused in Chapters 4, 9, and 10.
