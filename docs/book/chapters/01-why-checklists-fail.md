> **Scope:** Chapter 1 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Chapter 1 — Why checklists fail

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 6,000 words. Facts about Azure behavior must be re-verified against Microsoft documentation before submission.*

---

## The quarter that went well

At the end of the third quarter, Contoso's cloud security team presented a good slide.

Their posture score for the production subscriptions had climbed from 61% to 78%. Open recommendations had dropped from 512 to 371. Every high-severity item older than 30 days was closed or had an approved exception. The trend line pointed up and to the right, and the CISO said so in the leadership meeting.

Nothing on the slide was false. The team had worked hard. They had turned on encryption settings, removed stale guest accounts, enabled diagnostic settings on key vaults, and tagged two hundred resources with owners. Each of those changes made the environment a little better.

Three weeks later, a contractor doing an unrelated review of the payments team's deployment pipeline noticed something. Any change merged to the `main` branch of the `contoso/payments` GitHub repository could run a workflow that signed in to Azure as the payments deployment identity. That identity held **Contributor** on the production payments resource group. The resource group contained a storage account called `custdata`, which still allowed access with shared account keys. Contributor is allowed to list those keys. The keys open every blob in the account.

So a single merged pull request, from anyone who could get code onto `main`, was enough to read the account holding Contoso's customer records.

Every piece of that chain had been visible to the posture tool all along. None of it was hidden. Here is how the pieces appeared on the team's list:

| Piece of the chain | How it appeared on the posture list |
|--------------------|-------------------------------------|
| GitHub Actions trusted to sign in as `payments-deploy` | Not a finding. Federated credentials are the *recommended* replacement for stored secrets. |
| `payments-deploy` holds Contributor on `rg-payments-prod` | One of 41 "consider least-privilege role assignments" items. Medium. |
| `custdata` allows shared key access | One of 63 "storage accounts should prevent shared key access" items. Medium. |
| No blob read logging on `custdata` | One of 88 "enable diagnostic logs" items. Low. |

Two mediums, a low, and something the list counted as good practice. On their own, none was urgent. Together, they formed the most serious exposure in the environment. The posture score went up all quarter while this path stayed open, because the score was measuring something else.

This chapter explains why that happens, why it isn't the team's fault, and what to measure instead. The rest of the book builds on the answer.

---

## 1.1 What checklists are good at

Before criticizing checklists, it's worth being clear about what they do well, because the argument of this book is not "throw away your posture tool."

A security checklist, whether it's a benchmark, a regulatory control set, or a cloud provider's built-in recommendations, encodes hard-won knowledge about what tends to go wrong. Each item exists because someone, somewhere, was hurt by its absence. Checklists give you:

- **Coverage.** A good benchmark covers hundreds of settings across identity, network, storage, compute, and logging. Few people could list them from memory.
- **Consistency.** Two engineers applying the same checklist to the same subscription get the same answer. That makes the results comparable across teams and over time.
- **A shared language with auditors.** Compliance frameworks are mostly checklists. Mapping your environment to one is often required, and a posture tool makes that mapping cheap.
- **Cheap, safe improvement.** Most items can be fixed in isolation by one team without coordinating with anyone. That's why closing them feels productive. It usually is.

If your environment has never been measured against a baseline, start there. Basic hygiene closes many of the easiest attack paths before anyone has to think about paths at all.

The problem starts when the checklist stops being one input and becomes *the* measure of security. Three structural properties of checklists then work against you.

---

## 1.2 Three structural failures

### Failure 1: Items are scored one at a time

A checklist evaluates each item independently. "Does this storage account allow shared key access?" is answered by looking at one property of one resource. "Does this identity hold a broad role?" is answered by looking at one role assignment.

That independence is what makes checklists cheap and consistent. It's also why they can't see risk that only exists in combination. An attacker doesn't care whether each setting is individually acceptable. They care whether there's a sequence of steps from where they are to what they want. Each step can be modest; the sequence is what matters.

John Lambert, then at Microsoft, put this memorably in 2015:

> "Defenders think in lists. Attackers think in graphs. As long as this is true, attackers win."

The Contoso path is a graph: a repository connects to an identity, the identity connects to a resource group, the resource group contains a storage account, and the storage account's keys connect to the data. Each edge, viewed alone, is a list item of modest severity, or no item at all. The danger lives in the connections, and a list has no place to put connections.

### Failure 2: Severity ignores context

The second failure follows from the first. Because each item is evaluated alone, its severity has to be assigned without knowing where it sits.

"Storage account allows shared key access" gets the same severity on a throwaway sandbox account holding test images as it does on `custdata`. "Identity holds Contributor at resource-group scope" gets the same severity whether the resource group holds a static website or the payments database.

Posture tools try to compensate. Some let you tag resources as critical, some weight subscriptions, some add "environment" filters. Those help. But they're adjustments to a fundamentally context-free model. They can say "this item is on an important resource". They can't say "this item is the third link in the only chain that reaches the important resource."

The practical effect is that real priorities get diluted. Contoso had 63 shared-key findings. Sixty-two of them were tolerable. One of them was the last step to their customer data. The list presented them as 63 equal rows, sorted by resource name.

### Failure 3: Progress is measured as activity

The third failure is about what the organization rewards.

A checklist naturally produces activity metrics: items closed, percentage compliant, score trend. They're easy to compute, easy to chart, and easy to assign to teams. They also measure *effort*, not *exposure*.

Closing 141 recommendations is real work. It may or may not reduce the ways an attacker can reach what matters. At Contoso, the quarter's work didn't touch the path at all, because none of the four pieces was individually high enough to reach the top of anyone's queue. The metric rewarded closing many cheap items over closing the few that mattered.

This isn't a criticism of the team. People optimize what they're measured on. If the dashboard counts closed findings, teams will close findings, starting with the easiest ones, because that's the rational response to the incentive. To change the behavior, you have to change the measure.

---

## 1.3 Toxic combinations

A **toxic combination** is a set of conditions that are each acceptable, or at most moderately concerning, alone, but that together create a serious exposure.

The term is useful because it names the failure precisely. The problem isn't that the checklist missed a setting. The problem is that the checklist can't represent *and*.

Here's the Contoso chain again, this time viewed as a combination:

| # | Condition | Alone | In combination |
|---|-----------|-------|----------------|
| A | GitHub Actions on `main` can sign in as `payments-deploy` | Good practice (no stored secret) | Entry point: anyone who can merge to `main` |
| B | `payments-deploy` holds Contributor on `rg-payments-prod` | Broad, but common for deployment identities | Turns the entry point into control of every resource in the group |
| C | `custdata` allows shared key access | Legacy setting, widely tolerated | Lets Contributor become *data* access by listing keys |
| D | No blob read logging on `custdata` | Missing telemetry | Use of the path would leave no record |

Remove any one of A, B, or C and the path breaks. D doesn't create the path, but it means you'd never know whether it had been used. Chapter 2 returns to why that matters for what you're allowed to claim.

Notice two things about this table.

First, **the fix is cheap once you see the combination.** Disabling shared key access on `custdata`, or narrowing `payments-deploy` to the specific roles its deployments actually need, breaks the path. That's an afternoon's work. The expensive part was *seeing* it.

Second, **condition A isn't a finding at all.** Federated credentials for CI/CD are what Microsoft and GitHub both recommend in place of stored client secrets, and they're right. A good practice can still be a step in a dangerous path. What makes it safe or unsafe is what the identity can reach. A checklist that only flags bad practices will never show you that step, because there's nothing wrong with it alone.

Toxic combinations aren't rare edge cases. In most real Azure estates, they're the main way serious exposure happens. Identity is involved in nearly all of them, because in Azure the identity layer connects everything else. Chapter 4 covers identity paths in depth.

---

## 1.4 Thinking in paths

If lists can't represent combinations, what can? A **path**.

A path has three parts:

- An **entry point**: somewhere an attacker could plausibly start. The internet, a compromised developer laptop, a CI/CD pipeline, a guest account, a public-facing app.
- A **target**: something whose compromise matters. Customer data, signing keys, the ability to change production, the identity platform itself.
- **Hops**: the steps in between. Each hop is a relationship that lets someone at one point get to the next: a group membership, a role assignment, a network rule, a managed identity attached to a VM, a key stored in an app setting.

The Contoso path in this form:

```text
[Entry]  merge to main in contoso/payments
   │  federated credential trusts workflow tokens from main
   ▼
identity: payments-deploy
   │  role assignment: Contributor at rg-payments-prod
   ▼
scope: rg-payments-prod
   │  contains (RBAC inheritance)
   ▼
resource: storage account custdata
   │  Contributor can list keys; shared key access enabled
   ▼
[Target] blob data in custdata (customer records)
```

Thinking this way changes three things.

**It changes what you prioritize.** You rank paths, not items. The question becomes: which entry points can reach which targets, through how many hops, with what level of privilege at the end? A path from the internet to customer data in three hops outranks a hundred isolated mediums. A medium that sits on no path to anything important can wait.

**It changes what you fix.** Each path has one or more **cut points**: hops where a single change breaks the path. Some cut points break many paths at once. Removing one overly broad role assignment might close dozens. Fixing by cut point is usually far less work than fixing by list, because you fix the few things that matter most. Chapter 9 is about finding them.

**It changes how you measure progress.** Instead of "items closed," you report "paths from internet-facing entry points to crown-jewel data: 14 last quarter, 3 this quarter." That number goes down only when real exposure goes down. Chapter 10 covers outcome metrics and how to verify them honestly.

### Paths are not new

Path thinking isn't new, and this book doesn't claim to have invented it. Attack graphs have decades of academic history. Tools that compute attack paths through Active Directory changed on-premises security assessments in the 2010s. Several cloud security products, including Microsoft's own Defender for Cloud through its cloud security posture management (CSPM) plan, now offer attack path analysis for Azure.

> **As of 2026-10:** Check the current Defender for Cloud documentation for which attack-path scenarios and resource types are covered on your plan. Coverage changes frequently.

So why a book? For three reasons.

First, many teams that *have* path tooling still run their program from the checklist, because the score is what leadership asks for. The tool isn't the hard part; the operating model is.

Second, you need to understand how paths are built in order to judge any tool's output. Is this hop observed or assumed? What did the tool fail to collect? Why does it rank this path above that one? Those questions apply to commercial tools, to scripts you write yourself, and to whatever an AI assistant tells you. Chapters 3 through 6 give you the reasoning.

Third, AI is about to change how security teams consume all of this, and it's easy to get that wrong. That's the rest of this chapter.

---

## 1.5 Why lists persist

If paths are better, why does nearly every organization still run on lists? Not because security teams don't understand graphs. Lists persist because they're easier on every operational axis:

| | Lists | Paths |
|---|-------|-------|
| **Producing them** | Evaluate one property of one resource | Join identity, network, resource, and data evidence across the estate |
| **Partial data** | Each item is right or wrong on its own | A missing piece of evidence can hide or invent a whole path |
| **Assigning work** | Each item belongs to one resource owner | A path crosses team boundaries (pipeline team, identity team, data team) |
| **Explaining them** | "This setting is wrong" | "These five things, together, mean this" |
| **Compliance** | Maps directly to control frameworks | Has to be translated back to controls |
| **Measuring** | Count the items | Requires a definition of entry points and targets |

Every row on the right is harder. That isn't an argument against paths. It's a list of the problems this book has to solve.

Two of those rows deserve special mention, because they come back repeatedly.

**Partial data.** A list item computed from missing data is simply missing. A path computed from missing data can be wrong in either direction: a path you think exists may not, and a path that exists may be invisible because one hop wasn't collected. That makes honesty about evidence a hard requirement, not a nice-to-have. Chapter 2 builds the vocabulary for it; Chapter 3 covers collection and gaps.

**Explaining them.** A path is an argument with several premises. To act on it, someone has to understand and believe it. That's slow work for a human analyst writing it up, and it's exactly the work AI is good at speeding up, if you let it explain the evidence rather than replace it.

---

## 1.6 Where AI enters, and where it goes wrong

Most security teams first meet AI in their workflow as a faster way to read the list. You paste in or connect 371 recommendations, and a model gives you a summary: "Your top risks are identity hygiene, storage configuration, and logging gaps. Focus first on the following 10 items…"

That's genuinely helpful. It saves hours of reading. But look at what it's summarizing. A faster summary of a list is still a list. The model sees the same 371 independent items the posture tool produced. Unless it's given the relationships between them, it has no way to notice that four of them chain together. It will do what the list does: rank items by their own severity and by how often similar items appear.

Worse, it will do so fluently. A model asked "what's our biggest risk?" will give a confident answer whether or not the evidence supports one. At Contoso, a model summarizing the posture list would almost certainly have recommended the quarter's work the team actually did: reduce the big buckets of medium findings. It would have sounded authoritative. It would have missed the path.

There's a second, subtler temptation: asking the model to *find* the paths. Give it the inventory and ask, "What attack paths exist here?" Sometimes it produces something plausible. Sometimes the path is real. Sometimes it invents a hop, such as a role that doesn't include the permission it claims, or a network rule that isn't there. Sometimes it misses the real path entirely. And you can't easily tell which case you're in, because the output looks the same every time.

That's the central problem this book addresses. AI is strong at:

- turning a computed path into a clear explanation for a specific audience,
- triaging and summarizing evidence that's already been structured,
- drafting remediation steps and infrastructure-as-code changes for a human to review.

AI is weak, or at least unverifiable, at:

- establishing facts about your environment that an API could tell you directly,
- performing exhaustive, repeatable graph search across thousands of relationships,
- knowing what it didn't see.

The design principle that follows, and that runs through the rest of the book, is:

> **Compute paths from evidence with deterministic methods. Use AI to explain, triage, and draft, always on top of cited evidence, never instead of it.**

Chapters 7 and 8 work through where that line falls in practice and how to enforce it.

---

## 1.7 What changes when you work in paths

Suppose Contoso had been running its program on paths instead of items. What would the quarter have looked like?

**The first week.** Instead of a score, the team defines a short list of targets: the customer data store, the payment signing keys, the ability to deploy to production, and the Entra ID tenant's privileged roles. They also define entry points: internet-facing endpoints, CI/CD identities, guest accounts, and developer workstations. This takes a few meetings and some argument. It's the most valuable work of the quarter, because it forces the organization to say what matters.

**The first report.** A path analysis finds, say, 23 paths from entry points to targets. One of them is the payments path. It ranks near the top: short, ending in data access, starting from an entry point many people can reach. The report says what was collected and what wasn't. It also shows where the payments path rests on an assumption: whether branch protection on `main` really allows the merge that the path needs.

**The fix.** The payments team disables shared key access on `custdata`, after confirming nothing still uses the keys. The deployment identity's role is narrowed to the actions its pipeline needs. Two cut points, one afternoon each, and the path is gone. Several other paths that went through the same broad role assignment close at the same time.

**The measure.** At the end of the quarter, the slide says: "Paths from CI/CD and internet entry points to customer data: 6 → 1. The remaining path is accepted with an owner and an expiry date. Here's what we verified." The posture score probably went up too, because some of the cut points were also list items. But the score is a side effect now, not the goal.

**The list.** The team still works the checklist. Hygiene still matters, and auditors still ask. But the list stops setting priorities. Items on a path get pulled forward, and items on no path are worked as capacity allows.

None of that requires abandoning existing tools. It requires changing what you compute, what you rank, and what you report. The rest of the book shows how.

---

## 1.8 How the rest of the book is organized

The book follows the path from evidence to verified outcome:

- **Part I — Foundations.** This chapter makes the case for paths. Chapter 2 introduces the vocabulary for being honest about evidence: what you observed, what you computed, what you assumed, what a model guessed, and what a person told you. Chapter 3 covers collecting Azure evidence with read-only access, including how to handle the gaps you'll inevitably have.
- **Part II — Reasoning about paths.** Chapters 4, 5, and 6 cover the three kinds of hops that make up most Azure paths: identity and privilege, network reachability, and data flow.
- **Part III — AI in the loop.** Chapter 7 covers where language models help. Chapter 8 covers how they fail and how to contain the failures, including prompt injection through your own resource metadata.
- **Part IV — Closing the loop.** Chapter 9 covers advisory remediation and cut points. Chapter 10 covers verifying fixes and measuring outcomes. Chapter 11 covers governing the AI tooling itself, which is now one of your more sensitive systems.

The Contoso payments path runs through all of it. You'll see it labeled in Chapter 2, collected in Chapter 3, extended in Chapter 4, explained by a model in Chapter 7, attacked through a resource tag in Chapter 8, cut in Chapter 9, and verified in Chapter 10.

---

## 1.9 Lab: the same estate, two views

This lab makes the chapter's argument concrete. It uses the companion lab tenant (Appendix A), which deploys a small Azure estate with Terraform.

**Setup.** The lab deploys about 20 deliberate weaknesses into one subscription. Most are ordinary hygiene issues of the kind every estate has. Three of them, together with one *good* practice, form the payments path from this chapter.

| Weakness or setting | Role in the lab |
|---------------------|-----------------|
| Federated credential: GitHub Actions on `main` → `payments-deploy` | Good practice; path entry |
| `payments-deploy` holds Contributor on `rg-payments-prod` | Path hop |
| `custdata` allows shared key access | Path hop |
| `custdata` has no blob read diagnostic logging | Hides use of the path |
| Shared key access enabled on three sandbox storage accounts | Decoy: same item, no path to anything important |
| Contributor held by two other identities on non-production resource groups | Decoy |
| Key vaults without purge protection (two) | Hygiene |
| Missing diagnostic settings on several resources | Hygiene |
| Guest account with no recent sign-in | Hygiene |
| Storage accounts without minimum TLS version set | Hygiene |
| NSG allowing RDP from a single corporate IP range | Hygiene; not internet-wide |
| Untagged resources | Hygiene |

**Step 1 — The list view.** Run your posture tool of choice, or the lab's own checklist script, against the subscription. Sort the results by severity. Write down the first ten items you would fix this sprint. Note where, if anywhere, the three path hops appear.

**Step 2 — Ask a model about the list.** Export the list and give it to a language model with the prompt: *"Here are our security recommendations. What should we fix first, and why?"* Record its top five. Did it identify the payments path? Did it rank any of the path hops above the decoys with identical findings?

**Step 3 — The path view.** Using the lab's path script (or by hand, following the diagram in section 1.4), trace every route from the `main` branch entry point to the `custdata` blob data. Confirm each hop against the actual Azure configuration.

**Step 4 — Compare.** Answer these in writing:

1. How many list items would you have closed before reaching a path hop?
2. Which single change breaks the path with the least effort?
3. Would closing all the decoy shared-key items have reduced risk to customer data at all?
4. What would you put on a leadership slide after the fix, if not the posture score?

**What you should see.** The list view puts the path hops somewhere in the middle, indistinguishable from their decoy twins. The model's summary groups them with their twins too, because the list gives it no reason not to. The path view makes the problem and the fix obvious. That gap is the subject of this book.

---

## Summary

- Checklists are valuable for coverage, consistency, and compliance. Keep them, but don't let them set priorities.
- They fail structurally in three ways: items are **scored one at a time**, **severity ignores context**, and **progress is measured as activity** rather than exposure.
- Serious exposure usually comes from **toxic combinations**: individually tolerable conditions, sometimes including good practices, that together reach something important.
- A **path** (entry point, hops, target) can represent combinations that a list can't. Working in paths changes what you prioritize, what you fix (**cut points**), and what you measure (**paths removed**, not items closed).
- Path thinking isn't new, and commercial tools offer it. The hard parts are the operating model and being able to judge any path's evidence.
- AI that summarizes a list is still reading a list. AI asked to *find* paths may invent or miss hops without any visible difference.
- The book's principle: **compute paths from evidence; use AI to explain, triage, and draft on top of cited evidence, never instead of it.**

## Key terms

- **Posture checklist** — a set of independently evaluated configuration rules (benchmark, control set, or provider recommendations).
- **Toxic combination** — conditions that are each tolerable alone but together create a serious exposure.
- **Path** — a sequence of hops from an entry point to a target.
- **Entry point** — where an attacker could plausibly start.
- **Target** — an asset whose compromise matters to the organization (sometimes called a crown jewel).
- **Hop** — a relationship that lets someone at one point reach the next.
- **Cut point** — a hop where one change breaks one or more paths.
- **Activity metric** — a measure of work done (items closed); contrast with an **outcome metric** (exposure removed).

---

## Author notes (remove before submission)

- Verify the John Lambert quote wording and source (2015 GitHub post "Defender's mindset"); confirm attribution permission is not needed for a short quotation.
- Verify current names: "Storage accounts should prevent shared key access" (Azure Policy built-in display name); Defender for Cloud CSPM attack path analysis plan requirements.
- The posture figures (61% → 78%, 512 → 371 recommendations, 41 / 63 / 88 item buckets) are invented for the narrative; keep them clearly fictional.
- Lab table must stay in sync with Appendix A once the Terraform lab exists.
- Consider a figure: the same 20 lab items drawn as a list on the left and as a graph on the right, with the path highlighted.
