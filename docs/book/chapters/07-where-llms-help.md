> **Scope:** Chapter 7 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Chapter 7 — Where LLMs help

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 8,000 words. Facts about Azure AI services, model features, and pricing must be re-verified against Microsoft documentation before submission.*

---

## Two summaries of the same six paths

In this fictional scenario, Contoso's CISO asked for one paragraph about the payments paths from Chapter 4, for the board's risk committee. It was due by the end of the day.

An analyst pasted the role assignments, the federated credential, and a description of the Function App into a general-purpose chat assistant and asked for a board-level summary. Thirty seconds later they had this:

> Our investigation found that attackers could compromise Contoso's payments platform through multiple vectors, including the CI/CD pipeline and privileged help-desk accounts. Customer data in two storage accounts has been exposed, with an estimated 85% likelihood of exploitation if not remediated within 30 days. We recommend immediately revoking all Contributor access across the payments estate.

It read well. Almost every sentence in it was wrong in a way that mattered:

- "Our investigation found that attackers *could*" drifted, by the second sentence, to "customer data *has been exposed*". Nothing showed exposure. Chapter 2's hop 8 said there were no read logs to show anything either way.
- "85% likelihood" came from nowhere. Nothing calibrated produced it.
- "Revoking all Contributor access across the payments estate" would have broken every deployment pipeline the payments team owned, and it isn't what the graph pointed to. Chapter 4's lab showed that narrowing one identity's role closed all six paths.
- "Privileged help-desk accounts" turned one user with one directory role into a category.

The analyst's second attempt used the approach in this chapter. They gave the model a small, structured evidence pack generated from the snapshot, with the six paths as cited hop tables. They required a citation on every sentence and ran the result through a short validator. It took a few minutes longer to set up the first time. The output:

> Six access paths lead from people and pipelines to customer data in two storage accounts [P1–P6]. All six pass through one deployment identity, `payments-deploy` [H4]. Its broad role on the payments resource group lets it reach both stores [H5, H7, H9]. We have no evidence about whether any path has been used, because read logging is not enabled on either store [G1, G2]. Narrowing that one identity's role to what deployments need would close all six paths [C1].

That paragraph is shorter, less dramatic, and defensible line by line. It also contains a decision the board could actually make.

The model was the same both times. What changed was what it was given, what it was asked to do, and what happened to its output before anyone read it. That's the subject of this chapter.

---

## 7.1 Jobs language models do well, and jobs they shouldn't do

Chapter 1 stated the book's principle: compute paths from evidence with deterministic methods, and use AI to explain, triage, and draft on top of cited evidence, never instead of it. This chapter makes that concrete.

Language models are good at a specific set of jobs in security work:

| Job | Example | Why models are good at it |
|-----|---------|---------------------------|
| **Explain** | Turn a ten-hop path into a paragraph a human can follow | Fluent prose from structured input is what they do best |
| **Translate for an audience** | The same path for an engineer, an architect, an executive, an auditor | Adjusting vocabulary and emphasis is cheap for a model and slow for a person |
| **Summarize and triage** | Turn 23 paths and 6 gaps into "start here" | Compression and grouping, when the inputs are already structured |
| **Draft artifacts** | Runbook steps, a Terraform change, a ticket description | Producing a reviewable first draft quickly |
| **Interface to evidence** | Answer "who can read `custdata`?" by choosing and running a query | Turning a question into a tool call, then explaining the result |

And there are jobs they shouldn't do, which earlier chapters have already argued:

| Job | Do it with | Why not a model |
|-----|-----------|-----------------|
| Establish facts about the environment | APIs and snapshots (Chapter 3) | A model's answer is an AI inference; the API's is an observed fact |
| Decide what a role permits | Collected role definitions (Chapter 4) | Models don't know your custom roles, and their built-in role knowledge is frozen and sometimes wrong |
| Search the graph | Deterministic search (Chapter 4) | Exhaustive, repeatable search is what code does well and models don't |
| Rank paths | Explicit, versioned ranking rules (Chapter 9) | Ranking must be explainable and stable between runs |
| Decide a fix is complete | Snapshot comparison (Chapter 10) | "Fixed" is a claim to verify, not to generate |

Everything in this chapter sits in the first table and leans on the second. The model's input comes from deterministic work, and its output goes to a validator and a human.

---

## 7.2 The grounding pattern

The pattern that turns the first summary into the second has four stages:

```text
snapshot ──▶ deterministic derivation ──▶ evidence pack ──▶ model ──▶ validator ──▶ human
  (Ch 3)        (paths, gaps, cuts)        (small, cited)    (draft)   (mechanical)   (judgment)
```

Each stage has one job:

1. **Derivation** decides what's true, using the methods from Chapters 3 and 4. Nothing downstream may add facts.
2. **The evidence pack** contains exactly what the model may use, in a compact structure with short IDs for citation.
3. **The model** writes: explanations, summaries, drafts. Every claim it makes cites the pack.
4. **The validator** checks the draft mechanically against the pack and rejects drafts that break the rules.
5. **The human** reads what passed and decides whether it says the right thing.

Three properties make the pattern work:

- **The model sees only the pack.** Not the raw snapshot, not the internet, not its training-data memories of what Azure roles do. If something isn't in the pack, the model can't cite it, and the validator will reject any claim without a citation.
- **Citations are the contract.** Requiring a citation on every sentence turns "is this right?", which is hard to check, into "does hop H5 say this?", which is easy.
- **Failure is visible.** When the model can't produce a compliant draft, the result is a rejected draft and a reason, not a fluent paragraph that hides the problem.

The rest of this chapter takes the stages in order.

---

## 7.3 Building the evidence pack

The evidence pack is a small JSON document generated from your derivation step. It is *not* the snapshot. It's a deliberate selection: the paths relevant to the question, their hops, the gaps that affect them, and any recommended cut points.

```json
{
  "packId": "payments-paths-2026-10-06",
  "snapshotId": "2026-10-06T09-10-00Z-prod",
  "question": "Summarize access paths to customer data in the payments estate.",
  "hops": [
    { "id": "H1", "claim": "Workflows on main in contoso/payments can sign in as payments-deploy.", "category": "deterministic inference", "assumptions": ["Branch protection allows the merge"], "assumptionsChecked": false },
    { "id": "H2", "claim": "User dev-lead is an owner of the payments-deploy app registration and can add credentials to it.", "category": "observed fact" },
    { "id": "H3", "claim": "User helpdesk-07 holds Cloud Application Administrator, which can add credentials to payments-deploy.", "category": "derived fact" },
    { "id": "H4", "claim": "Any credential on the payments-deploy app lets the holder sign in as its service principal.", "category": "derived fact" },
    { "id": "H5", "claim": "The payments-deploy service principal holds Contributor on rg-payments-prod.", "category": "observed fact" },
    { "id": "H6", "claim": "custdata and the Function App pay-reconcile are in rg-payments-prod.", "category": "observed fact" },
    { "id": "H7", "claim": "Contributor can list custdata's keys, and shared key access is enabled, so the holder can read its blob data.", "category": "deterministic inference", "assumptionsChecked": true },
    { "id": "H8", "claim": "Contributor can deploy code to pay-reconcile, which runs as managed identity mi-pay-reconcile.", "category": "derived fact" },
    { "id": "H9", "claim": "mi-pay-reconcile holds Storage Blob Data Reader on custarchive.", "category": "observed fact" }
  ],
  "paths": [
    { "id": "P1", "hops": ["H1", "H4", "H5", "H6", "H7"], "target": "Read customer data in custdata", "confidence": "Medium" },
    { "id": "P2", "hops": ["H2", "H4", "H5", "H6", "H7"], "target": "Read customer data in custdata", "confidence": "High" },
    { "id": "P3", "hops": ["H3", "H4", "H5", "H6", "H7"], "target": "Read customer data in custdata", "confidence": "High" },
    { "id": "P4", "hops": ["H1", "H4", "H5", "H6", "H8", "H9"], "target": "Read archived customer data in custarchive", "confidence": "Medium" },
    { "id": "P5", "hops": ["H2", "H4", "H5", "H6", "H8", "H9"], "target": "Read archived customer data in custarchive", "confidence": "High" },
    { "id": "P6", "hops": ["H3", "H4", "H5", "H6", "H8", "H9"], "target": "Read archived customer data in custarchive", "confidence": "High" }
  ],
  "targets": [
    { "id": "T1", "claim": "custdata holds production customer records.", "category": "human assertion", "assertedBy": "Data Protection Officer", "assertedAt": "2026-09-14", "expiresAt": "2027-03-14" },
    { "id": "T2", "claim": "custarchive holds archived customer records.", "category": "human assertion", "assertedBy": "Data Protection Officer", "assertedAt": "2026-09-14", "expiresAt": "2027-03-14" }
  ],
  "gaps": [
    { "id": "G1", "claim": "Blob read logging is not enabled on custdata, so use of any path cannot be determined." },
    { "id": "G2", "claim": "Blob read logging is not enabled on custarchive, so use of any path cannot be determined." }
  ],
  "cutPoints": [
    { "id": "C1", "claim": "Narrowing payments-deploy from Contributor to the specific roles its deployments need would close P1 through P6.", "closes": ["P1", "P2", "P3", "P4", "P5", "P6"] }
  ]
}
```

Some deliberate choices in that structure:

- **Short, stable IDs** (`H5`, `P3`, `G1`). Citations are only checkable if they're unambiguous and short enough for a model to reproduce reliably. GUIDs and full resource IDs are neither.
- **Claims in plain language, written by the derivation step.** The model doesn't interpret raw JSON from Azure. It works from sentences that deterministic code has already produced and that a human can read.
- **Evidence category on every claim**, so the model, and the validator, know which verbs are allowed (Chapter 2, section 2.7).
- **Gaps and confidence included.** A pack without its gaps invites the model to sound more certain than the evidence is.
- **Only what's relevant.** A pack for "summarize the payments paths" doesn't include the other 17 paths in the estate. Smaller packs produce better output, cost less, and are easier to review.

### Sensitive data in the pack

The pack goes to a model, so treat it as data leaving your evidence store. Before a pack is sent:

- Use a model deployment your organization has approved for this data, under its data-handling terms (section 7.10).
- Replace identifiers you don't need with stable placeholders. "User A owns the app" is usually as useful as a real name and leaks less. Keep a mapping on your side if humans need the real names back.
- Never include secret values. Chapter 3 ensured the snapshot doesn't contain any, and the pack is built from the snapshot.

---

## 7.4 Asking for the draft

### Instructions

The instructions to the model carry the rules. A workable system message:

```text
You write security explanations from an evidence pack.

Rules:
1. Use only facts in the evidence pack. Do not use outside knowledge about Azure,
   roles, or the organization.
2. Every sentence must cite at least one ID from the pack in square brackets,
   for example [H5] or [P1-P3].
3. Match verbs to evidence categories:
   - "deterministic inference": use "can" or "is able to", never "did" or "has".
   - "AI inference": say "likely" and mark it "(AI-inferred)".
   - "human assertion": attribute it ("according to the Data Protection Officer").
4. Never state or imply that access has occurred. If the pack has a gap about
   observing access, say plainly that use cannot be determined.
5. Do not include numbers, percentages, or estimates that are not in the pack.
6. If the pack does not contain enough to answer, say "The evidence pack does not
   contain enough information to answer this" and stop.
```

Rule 6 matters more than it looks. Without an explicit way out, a model asked an unanswerable question will produce an answer anyway. With one, you can test whether it uses the exit when it should (Chapter 8).

### Structured output

Prose is pleasant to read and hard to check. Ask for structured output instead and assemble the prose afterwards:

```json
{
  "sentences": [
    { "text": "Six access paths lead from people and pipelines to customer data in two storage accounts.", "cites": ["P1", "P2", "P3", "P4", "P5", "P6"] },
    { "text": "All six pass through one deployment identity, payments-deploy.", "cites": ["H4"] }
  ]
}
```

Many model services, including Azure OpenAI, can constrain output to a JSON schema you supply, which removes a whole class of parsing failures. Even without that feature, asking for this shape makes validation far simpler than parsing citations out of free text.

> **As of 2026-10:** Verify which Azure OpenAI models and API versions support schema-constrained ("structured") outputs.

### Settings

Use a low temperature for explanation and summary work. Variety is a feature in brainstorming and a defect in a security report. Low temperature doesn't make output deterministic. Chapter 2's lab showed the same prompt producing different answers. It does reduce the spread.

---

## 7.5 Validating the draft

The validator is a short piece of deterministic code that checks the draft against the pack before any human sees it. It can't tell whether a sentence is *true*. It can tell whether the sentence broke the rules, and that catches most of the dangerous failures cheaply.

Checks worth running on every draft:

1. **Every sentence cites something.**
2. **Every cited ID exists** in the pack.
3. **No activity verbs** ("accessed", "exfiltrated", "stole", "breached", "has been exposed", "was used") unless a cited item records observed activity. In most packs, none does.
4. **No numbers that aren't in the pack.** This catches invented percentages, timelines, and counts.
5. **No names that aren't in the pack.** Resource names, role names, and identity names in the draft must appear in a cited claim. This catches invented roles and resources.
6. **Inference language is preserved.** A sentence citing only deterministic inferences shouldn't use "is" or "has" for the inferred capability. This is hard to check exactly; a simple heuristic catches the common slips.

A minimal validator in Python:

```python
import re

ACTIVITY_PATTERNS = [
    r"\baccessed\b", r"\bexfiltrat\w*", r"\bstole\b", r"\bstolen\b",
    r"\bbreach\w*", r"\bhas been exposed\b", r"\bwas used\b", r"\bcompromised\b",
]
NUMBER_PATTERN = re.compile(r"\b\d+(?:[.,]\d+)?%?")
NAME_PATTERN = re.compile(r"`([^`]+)`|\b([a-z]+(?:-[a-z0-9]+)+)\b")


def expand_range(citation: str) -> list[str]:
    """Turn 'P1-P3' into ['P1', 'P2', 'P3']; leave single IDs alone."""
    match = re.fullmatch(r"([A-Z])(\d+)-\1?(\d+)", citation)

    if not match:
        return [citation]

    prefix, start, end = match.group(1), int(match.group(2)), int(match.group(3))

    return [f"{prefix}{n}" for n in range(start, end + 1)]


def validate(draft: dict, pack: dict) -> list[str]:
    items = {item["id"]: item for key in ("hops", "paths", "targets", "gaps", "cutPoints") for item in pack.get(key, [])}
    pack_text = " ".join(item.get("claim", "") for item in items.values())
    pack_numbers = set(NUMBER_PATTERN.findall(pack_text)) | {str(len(pack.get("paths", [])))}
    problems: list[str] = []

    for index, sentence in enumerate(draft.get("sentences", []), start=1):
        text = sentence.get("text", "")
        cites = [c for raw in sentence.get("cites", []) for c in expand_range(raw)]

        if not cites:
            problems.append(f"Sentence {index}: no citation.")

        for cite in cites:
            if cite not in items:
                problems.append(f"Sentence {index}: cites unknown ID {cite}.")

        for pattern in ACTIVITY_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                problems.append(f"Sentence {index}: activity wording '{pattern}' with no observed activity in the pack.")

        for number in NUMBER_PATTERN.findall(text):
            if number not in pack_numbers:
                problems.append(f"Sentence {index}: number '{number}' does not appear in the pack.")

        for match in NAME_PATTERN.finditer(text):
            name = match.group(1) or match.group(2)

            if name and name not in pack_text:
                problems.append(f"Sentence {index}: name '{name}' does not appear in the pack.")

    return problems
```

Run against the board summary from the opening of this chapter, this validator rejects it immediately: no citations, "has been exposed", and "85%". Run against the second summary, it passes. One wrinkle: the validator allows the number of paths ("six") because the pack implies it, and a word like "six" isn't caught by a digit pattern at all. Validators need tuning to your conventions, and they're never perfect.

### What validation doesn't catch

A sentence can cite the right hop and still misstate it. "The deployment identity owns the storage account [H5]" cites a real hop, passes every check above, and is wrong: H5 is a role assignment, not ownership. Catching that requires judging whether the sentence is **supported** by what it cites, which is a harder problem. Chapter 8 covers it: using a second model as a checker, sampling for human review, and building test sets.

For now, the division of labor is:

- **The validator** catches rule-breaking: no citation, invented numbers, invented names, activity wording.
- **The human** catches misstatement: the sentence cites H5, but is that what H5 says?

That human check is far faster than writing the paragraph from scratch, because every sentence points to exactly what to compare it against.

---

## 7.6 One evidence pack, many audiences

The same evidence pack can produce explanations for very different readers. Only the audience instruction changes, and the citations keep every version tied to the same facts.

**Executive or board** — consequence, decision, cost of the decision, honesty about what isn't known:

> Six access paths lead from people and pipelines to customer data in two storage accounts [P1–P6]. All six run through a single deployment identity [H4], so one change closes all of them [C1]. We cannot tell whether any path has been used, because read logging is not enabled on either store [G1, G2].

**Security architect** — structure, convergence, assumptions, where the evidence is weakest:

> All six paths converge on the `payments-deploy` service principal [H4] and its Contributor assignment on `rg-payments-prod` [H5]. Entry is through three routes: GitHub workflows on `main` [H1], app ownership by `dev-lead` [H2], and the Cloud Application Administrator role held by `helpdesk-07` [H3]. The GitHub route rests on an unchecked assumption about branch protection [H1], which is why P1 and P4 are rated Medium [P1, P4]. From the resource group, two conversions reach data: key listing on `custdata` [H7] and code deployment to `pay-reconcile`, which runs as an identity with blob read on `custarchive` [H8, H9].

**Engineer on the payments team** — what to change and in what order:

> The highest-leverage change is to replace the Contributor assignment for `payments-deploy` on `rg-payments-prod` with roles scoped to what the pipeline deploys [H5, C1]. Before changing it, list which resource types the pipeline actually deploys, so the replacement roles don't break releases. Separately, removing `dev-lead` as an owner of the app registration closes the ownership entry point [H2].

**Auditor** — evidence chain and time:

> Each path is derived from snapshot `2026-10-06T09-10-00Z-prod` [P1–P6]. Role assignments and app ownership are observed facts from that snapshot [H2, H5, H9]. The customer-data classification of both stores is an assertion by the Data Protection Officer dated 2026-09-14, valid until 2027-03-14 [T1, T2]. Use of the paths cannot be determined from available logs [G1, G2].

Writing four versions by hand would take an analyst most of a morning. With a pack, a prompt per audience, and a validator, it takes minutes, and each version is checkable against the same citations. In practice, this is often the first place teams see a real return on using models in security work.

Notice one sentence in the engineer version: "list which resource types the pipeline actually deploys". It cites nothing, and the validator would reject it. That's correct behavior. It's advice, not a fact from the pack. You can either allow a separate, clearly marked class of uncited *recommendations*, or move that advice into the pack as part of the cut-point record. The second is better, because then the advice is reviewed once, by a person, rather than generated fresh in every draft.

---

## 7.7 Drafting remediation

Models are good at drafting the artifacts that carry a fix: runbook steps, infrastructure-as-code changes, change tickets. The grounding pattern still applies, with one addition: **the model drafts, and a human and a pipeline apply.**

Give the model the cut-point record and the relevant hops, and ask for:

- the change itself,
- **preconditions** to check before applying it,
- how to **verify** it worked,
- how to **roll it back**.

For example, asking for a Terraform change to disable shared key access on `custdata` (one of the alternative cut points from Chapter 4) might produce:

```hcl
resource "azurerm_storage_account" "custdata" {
  # ...existing configuration...

  # Disables account-key and SAS-based access; callers must use Entra ID.
  shared_access_key_enabled = false
}
```

with preconditions like "confirm in storage logs or with the owning teams that no application uses the account keys or account SAS tokens", verification like "re-collect and confirm the property reads as disabled; confirm the key-listing path is gone from the graph", and rollback like "set the property back to `true` and re-apply".

A few rules keep this safe:

- **The model never holds write permissions.** It produces text. A human reviews it, and the change goes through your normal pipeline: pull request, plan, approval, apply. Chapter 9 argues this at length.
- **Check the draft against the provider's documentation.** Models produce plausible attribute names that don't exist or were renamed. `terraform validate` and `plan` catch many of these; review catches the rest.
- **Preconditions are the valuable part.** The change is often one line. Knowing what it might break is what saves the outage, and models are good at listing the categories of things to check, even though they can't check them.

> **As of 2026-10:** Verify the current `azurerm` provider attribute name for disabling shared key access, and any related settings such as default-to-Entra-ID-authentication options.

---

## 7.8 Triage and change summaries

Two more summarizing jobs come up constantly, and both fit the pattern.

### Gap summaries

A manifest with a dozen gaps (Chapter 3) is accurate but hard to act on. A model given the gap list, and only the gap list, can turn it into a short, prioritized note:

> Two production subscriptions were not readable by the collector, so any paths through them are unknown [G3, G4]. The payments production subscription is one of them [G3]. Granting the collector Reader there is the most valuable fix to the collection itself.

This is low-risk, useful work. The model is compressing facts that are already explicit.

### Change summaries

Between two snapshots, your derivation step can compute a diff: paths that appeared, paths that disappeared, gaps that opened or closed. A model can turn that diff into a weekly note:

> Two paths to `custdata` closed this week after `dev-lead` was removed as an owner of `payments-deploy` [D1, D2]. One new path appeared: a new user was added to the group holding Cloud Application Administrator [D3].

The rule is the same as always. The diff is computed deterministically and becomes the pack. The model narrates it. A model asked to "compare these two snapshots" directly will find some differences and miss others.

---

## 7.9 Questions over evidence: the model as interface

Sometimes people want to ask a question rather than read a report: "Who can read `custdata`?" "Which paths go through the help desk?" "What changed in payments this week?"

The tempting design is to put the snapshot into a model's context, or into a retrieval index, and let it answer. For the reasons in sections 7.1 and 4.9, that produces fluent answers that are hard to trust: the model searches poorly, can't see what it didn't retrieve, and fills gaps with plausible guesses.

A better design treats the model as an **interface** rather than an **oracle**:

1. You define a small set of deterministic **tools**: "paths to a target capability", "who has effective access to a resource", "paths through a given identity", "diff between two snapshots".
2. The model's job is to turn the user's question into a call to one of those tools, with arguments.
3. Your code runs the tool against the snapshot and returns structured results, which become an evidence pack.
4. The model explains the results with citations, and the validator checks them.

```text
"Who can read custdata?"
   │  model chooses tool + arguments
   ▼
effective_data_access(resource="custdata", action="read")
   │  deterministic code over the snapshot
   ▼
evidence pack: 4 principals, 6 paths, 1 gap
   │  model explains with citations
   ▼
validator ──▶ answer
```

Most current model services, including Azure OpenAI, support this "tool calling" or "function calling" pattern directly. The important design choice isn't the API. It's that **the answer comes from the tool, and the model only chooses the tool and explains the result.** If no tool fits the question, the right answer is "I can't answer that from the available evidence", not an improvised one.

---

## 7.10 Choosing a model service on Azure

There are two broad options for teams working in Azure, and many organizations use both.

**Azure OpenAI, through Azure AI Foundry.** You deploy specific models in your own subscription and call them from your own code. This is the natural fit for the grounding pattern in this chapter, because you control the evidence pack, the prompt, structured output, tool definitions, and the validator. Questions to settle with your security and privacy teams:

- **Data handling.** What the service retains, whether prompts are used for training (generally no, for Azure OpenAI), and what abuse monitoring applies and whether you need an exemption for sensitive data.
- **Network.** Whether you can reach the deployment over a private endpoint and disable public access (Chapter 11).
- **Region and residency.** Where the model runs and whether that satisfies your data residency requirements.
- **Model lifecycle.** Pin model versions explicitly. Models are retired on a schedule, and a version change can change output behavior. Re-run your test set (Chapter 8) when you change versions.
- **Cost.** Packs are small, so explanation work is usually cheap. Cache explanations per snapshot and audience rather than regenerating them on every page view.

**Microsoft Security Copilot.** A Microsoft security product built on large language models and integrated with Microsoft's security tools, such as Defender, Sentinel, Entra, and Intune. It suits analysts working inside those products. It's less suited to the custom pipeline in this chapter, because you have less control over the evidence passed to the model and how its output is checked. It can still be valuable alongside your own pipeline, for example in incident investigation inside Sentinel.

> **As of 2026-10:** Verify current product names (Security Copilot was earlier branded Copilot for Security), Azure OpenAI data-handling and abuse-monitoring terms, private endpoint support, structured output and tool-calling support by model, and regional availability.

Whichever you choose, the deployment that receives evidence packs is now a sensitive system. It sees summaries of your most serious exposures. Chapter 11 covers governing it.

---

## 7.11 Measuring whether it's helping

It's easy to adopt a model because the output looks impressive. Measure instead:

- **Validator pass rate.** What share of drafts pass on the first attempt? A falling rate after a model version change is an early warning.
- **Human edit rate.** How much do reviewers change before sending? Track it per audience. If executive summaries are rewritten every time, the prompt or the pack is wrong.
- **Time to a sendable artifact.** Compare against the manual baseline. This is the number that justifies the work.
- **Errors found after sending.** Any misstatement that reached a reader is a test case for Chapter 8.

Keep a small set of evidence packs with known correct explanations, and re-run them whenever you change the prompt, the model, or the validator. That set is the beginning of the evaluation discipline Chapter 8 builds out.

---

## 7.12 Lab: a grounded explanation pipeline

This lab builds the full pattern for the payments paths. It extends Chapter 2's grading exercise into something you could run every week.

**Prerequisites.** The identity graph and paths from Chapter 4's lab, and access to a model deployment your organization has approved for this data. Use the companion lab tenant's synthetic data unless your policy explicitly allows sending real evidence to the deployment.

**Step 1 — Generate the pack.** Write a function that takes the paths from Chapter 4's search, plus the gap list and any cut points, and emits a pack in the shape of section 7.3. Claims must be generated from the snapshot data, not written by hand. Assign short IDs.

**Step 2 — Request structured output.** Send the pack with the system message from section 7.4 and an audience instruction ("for a board risk committee, in at most four sentences"). Request the sentence-and-citation JSON shape, using schema-constrained output if your deployment supports it.

**Step 3 — Validate.** Run the validator from section 7.5. If it fails, send the problems back to the model as feedback and ask for a corrected draft, at most twice. Record whether it eventually passed.

**Step 4 — Four audiences.** Repeat steps 2 and 3 for the architect, engineer, and auditor audiences. Compare the four outputs and confirm that every factual sentence in each traces to the same pack items.

**Step 5 — Break it on purpose.** Run each of these and record what happens:

1. Remove gaps G1 and G2 from the pack. Does the board summary still say that use can't be determined? (It shouldn't be able to, and the validator can't catch the omission. This is a pack-construction failure, which is why gaps must always be included.)
2. Add an AI-inferred hop ("`custarchive` likely contains payment card data (AI-inferred)") and check whether the output preserves "likely" and the AI label.
3. Ask a question the pack can't answer ("How much would a breach cost?") and confirm the model uses the rule 6 exit rather than inventing a figure.
4. Paste the opening story's board summary into the validator and confirm every problem is reported.

**Step 6 — Measure.** Time how long it takes you to review and approve the four outputs, and compare it with how long writing one of them by hand would take.

**What you should see.** The validator rejects the ungrounded summary outright and passes most grounded drafts on the first or second attempt. The four audience versions read very differently but rest on identical citations. Step 5's first case shows the limit of validation: it checks what the model wrote, not what the pack left out.

---

## Summary

- Language models are strong at **explaining, translating for audiences, summarizing, drafting, and acting as an interface to deterministic tools**. They shouldn't establish facts, interpret roles, search graphs, rank paths, or declare fixes complete.
- The **grounding pattern** is: deterministic derivation → small **evidence pack** → model draft with **citations** → mechanical **validator** → human review.
- Build packs with **short IDs, plain-language claims, evidence categories, gaps, and only what's relevant**. Treat them as data leaving your evidence store.
- Give the model **explicit rules** about sources, citations, verbs by evidence category, numbers, and an **exit for unanswerable questions**. Ask for **structured output**.
- Validators catch **rule-breaking** (no citation, unknown IDs, activity wording, invented numbers and names), not **misstatement**. Humans and Chapter 8's techniques cover the rest.
- One pack can serve **many audiences**, each traceable to the same facts.
- Models **draft** remediation with preconditions, verification, and rollback. Humans and pipelines **apply** it.
- For questions, use the model as an **interface to deterministic tools**, not as an oracle.
- **Measure** pass rates, edit rates, and time saved, and keep a test set of packs.

## Key terms

- **Grounding** — constraining a model to produce output only from supplied evidence, with citations.
- **Evidence pack** — a small, structured selection of derived claims, paths, gaps, and cut points, with short IDs, sent to a model.
- **Citation** — a reference from a generated sentence to the pack item that supports it.
- **Validator** — deterministic code that checks a draft against its pack for rule violations before a human sees it.
- **Structured output** — model output constrained to a defined schema (for example, sentences with citation lists).
- **Tool calling** — a model selecting a predefined function and arguments, which your code executes.
- **Model as interface** — using a model to choose deterministic queries and explain their results, rather than to answer from its own knowledge.

---

## Author notes (remove before submission)

- Verify: Azure OpenAI structured output support by model and API version; tool/function calling support; data retention, training use, and abuse-monitoring terms and exemption process; private endpoint support; model version pinning and retirement policy.
- Verify: Microsoft Security Copilot current name, positioning, and integrations.
- Verify: `azurerm_storage_account` attribute `shared_access_key_enabled` and related Entra-default settings in the current provider version.
- The validator is intentionally simple; test it against the opening story and the lab outputs before publication, and make sure the name regex doesn't flag ordinary hyphenated English words in practice.
- The "85% likelihood" and other figures in the opening are fictional.
- Consider a figure for the grounding pipeline in section 7.2.
- Add the Chapter 7 fact checks to GTM **M-306** when it is picked up.
