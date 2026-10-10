> **Scope:** Chapter 9 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals. The ranking rules and cost tiers here are illustrative examples for the reader, not any product's actual rules.
> **Status:** draft

# Chapter 9 — Advisory remediation

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 6,000 words. Terraform provider resource names, Azure Policy built-in definitions, and role names must be re-verified against current documentation before submission.*

---

## Forty tickets and one conversation

In this fictional scenario, Contoso's security team finished the payments review from Chapters 4 to 6 and did what most teams do next: they opened tickets. One per finding. The scanner had forty findings for the payments estate, so the payments team received forty tickets: "storage account allows shared key access", "app registration has a user owner", "service principal holds Contributor at resource group scope", "public network access enabled", and thirty-six more, each with a severity, a due date, and a link to a benchmark control.

Six weeks later, three were closed. The payments team wasn't negligent. They had a release schedule, and forty tickets with no explanation of how they related to each other read like a list of preferences. Nobody could say which ones mattered or what closing any of them would achieve.

The CISO tried a different approach. She asked for one page: which changes would close the most paths to customer data, what each would cost the payments team, and what would be left afterward. The analysis took an afternoon, because the paths already existed from Chapter 4. The answer was three changes:

1. Remove `dev-lead` as an owner of the `payments-deploy` app registration.
2. Remove the Cloud Application Administrator role from `helpdesk-07`, and give the help desk a narrower role for the tasks they actually perform.
3. Disable shared key access on `custdata`, with an Azure Policy assignment that stops anyone from turning it back on.

Those three changes closed five of the six paths. The sixth, from the production deployment pipeline through `pay-reconcile` to the archive, couldn't be closed without stopping the pipeline from deploying the app it exists to deploy. The page said so, recommended a compensating control, and asked the payments lead to accept the remaining risk in writing, with an expiry date.

The payments team made the three changes in one sprint. Nobody argued about severity. The page showed what each change bought.

This chapter is about producing that page: ranking paths with explicit rules, finding the changes that close the most of them at the least cost, checking that those changes actually hold, and handing them to the people and pipelines that apply changes, without the analysis tool ever touching the environment itself.

---

## 9.1 From findings to cut points

Chapter 1 introduced the idea: every path has **cut points**, hops where one change breaks the path. Some changes break many paths at once. Fixing by cut point means making the few changes that matter most.

A few definitions make that precise:

- A **change** is something a person can actually do: remove a role assignment, remove an owner, change a setting. One change can remove several edges in the path graph. Narrowing a role, for example, can remove both a `canControlCode` edge and a `grants` edge, because both were derived from that role (Chapter 4).
- A change **closes** a path if it removes at least one of the path's edges.
- A **cut set** is a set of changes that, together, close every path from a group of entry points to a group of targets.
- A **plan** is a cut set with an order, owners, costs, and the paths that remain open afterward.

The useful question is rarely "what's the smallest cut set?" It's "which changes close the most important paths for the least cost and risk, and what's left?" That needs two inputs this chapter adds: a ranking of paths, and a cost for each change.

There's a well-known result in graph theory, the max-flow min-cut theorem, which gives the minimum number of edges whose removal disconnects two nodes, and efficient algorithms that compute it. It's worth knowing it exists. This chapter uses a simpler greedy method instead, for reasons that become clear in section 9.3: real changes don't map one-to-one onto edges, some edges can't be removed at all, and costs are rough human estimates. A greedy method you can explain to a payments lead is worth more than an optimal one you can't.

---

## 9.2 Ranking paths with explicit rules

Before choosing what to cut, decide what matters most. Chapter 7 said models shouldn't rank paths, and Chapter 8 said not to let them produce severity scores. The alternative is a small set of explicit rules, written down, versioned, and applied by code.

### Choose a few factors

Good ranking factors come from the earlier chapters, and each is something the evidence already contains:

| Factor | Source | Example levels (best to worst) |
|--------|--------|--------------------------------|
| **Consequence** of the target | Human assertion about the target (Chapter 2) | Customer data or production control → internal data → low-value resources |
| **Entry exposure** | Who can start the path (Chapter 4) | Anyone on the internet → any user in the tenant → a specific internal identity → a privileged administrator |
| **Data-plane reach** | Where the last hop can be used (Chapter 5) | From the internet → from Azure → from internal networks only |
| **Confidence** | Path band (Chapter 2) | High → Medium → Low |
| **Length** | Hop count | Fewer hops first |

The levels are ordinal. Nobody can say a customer-data target is "3.7 times" worse than an internal-data target, and pretending otherwise is the fake precision Chapter 8 warned about.

### Order lexicographically, not by weighted sum

The common approach is to give each factor a number and add them up: consequence × 0.4 + exposure × 0.3, and so on. The total looks objective. It isn't. The weights are judgments, and their interaction is opaque: a low-consequence path with every other factor bad can outrank a customer-data path, and nobody can explain why without opening a spreadsheet.

A simpler rule is easier to defend: sort by the most important factor first, and use the next factor only to break ties. Consequence first, then entry exposure, then data-plane reach, then confidence, then length.

```python
RULESET_VERSION = "contoso-path-ranking-2026-10-01"

CONSEQUENCE = {"customer data": 0, "production control": 0, "internal data": 1, "low value": 2}
EXPOSURE = {"internet": 0, "any tenant user": 1, "specific identity": 2, "privileged admin": 3}
REACH = {"internet": 0, "azure": 1, "internal": 2}
CONFIDENCE = {"High": 0, "Medium": 1, "Low": 2}


def rank_key(path: dict) -> tuple[int, int, int, int, int]:
    """Lower sorts first. Unknown levels raise KeyError instead of being guessed."""
    return (
        CONSEQUENCE[path["consequence"]],
        EXPOSURE[path["exposure"]],
        REACH[path["reach"]],
        CONFIDENCE[path["confidence"]],
        len(path["hops"]),
    )
```

The numbers in those dictionaries aren't weights. They're only sort positions within each factor. The ruleset version goes into every ranked output, so when someone asks in six months why a path was ranked where it was, you can reproduce the answer.

Applied to the six payments paths from Chapter 4, with Chapter 5's reach and Chapter 2's confidence bands:

| Rank | Path | Target | Entry | Reach | Confidence | Hops |
|------|------|--------|-------|-------|------------|------|
| 1 | P2 | `custdata` | `dev-lead` (specific identity) | Internet (key usable anywhere) | High | 3 |
| 2 | P3 | `custdata` | `helpdesk-07` (specific identity) | Internet | High | 3 |
| 3 | P1 | `custdata` | Production pipeline (specific identity) | Internet | Medium | 3 |
| 4 | P5 | `custarchive` | `dev-lead` | Azure (managed identity in Azure) | High | 5 |
| 5 | P6 | `custarchive` | `helpdesk-07` | Azure | High | 5 |
| 6 | P4 | `custarchive` | Production pipeline | Azure | Medium | 5 |

Hop counts here are privilege edges in Chapter 4's searchable graph (for example: credential to app, app to service principal, service principal to capability), not the longer hop tables in Chapter 7's pack, which also list structural facts such as containment. P2 and P3 tie on every factor, so their relative order is arbitrary; a ranking should say so rather than invent a difference.

A ranking like this is where conversations about priority should happen. If the payments lead thinks the archive matters as much as live data, that's a change to the consequence levels, made in one place, versioned, and applied to every path. It's not an argument about one ticket's severity.

---

## 9.3 Finding cut sets

### Changes, not edges

The path graph from Chapter 4 has edges. People make changes. Before searching for cut sets, list the changes that are actually possible for the edges on your paths:

| Change | Edges it removes | Cost | Removes something required? |
|--------|------------------|------|-----------------------------|
| Remove `dev-lead` as app owner | `dev-lead` → `canAddCredential` → app | Low | No |
| Remove Cloud Application Administrator from `helpdesk-07` | `helpdesk-07` → `canAddCredential` → app | Medium (help desk needs a replacement role) | No |
| Disable shared key access on `custdata` | `payments-deploy` → `grants` → read `custdata` (key route) | Medium (check logs for key users first, Chapter 6) | No |
| Narrow `payments-deploy` to deployment roles | the key-route `grants` edge | High (enumerate what the pipeline deploys) | No |
| Remove `payments-deploy`'s ability to deploy `pay-reconcile` | `payments-deploy` → `canControlCode` → `pay-reconcile` | — | **Yes**: deploying it is the pipeline's job |
| Remove `mi-pay-reconcile`'s data role on `custarchive` | `mi-pay-reconcile` → `grants` → read `custarchive` | — | **Yes**: confirmed flow (Chapter 6) |
| Remove the pipeline's federated credential | entry → `canSignInAs` → app | — | **Yes**: the pipeline needs to sign in |

Three things in that table deserve attention.

**Costs are human estimates.** "Low", "medium", and "high" come from the people who will make the change. They're human assertions in Chapter 2's sense. Record who estimated them.

**Some edges are required.** Chapter 6's confirmed flows and the system's legitimate functions mark edges that can't be removed without breaking the business. A cut-set search that ignores this will recommend stopping the payments pipeline. Mark those changes and exclude them.

**This is where convergence meets reality.** Chapter 4's lab asked which single change removes the most paths. All six paths pass through `payments-deploy`, so narrowing its role is the obvious answer. If you read the graph as edges alone, narrowing looks like it removes both of the identity's outgoing edges and every path with them. But when the payments lead lists what the pipeline deploys, the list includes `pay-reconcile`. The narrowed role must still allow deploying it, so the `canControlCode` edge stays, and the three archive paths survive, as Chapter 4's lab found. Whoever deploys code can act as that code. No role design changes that. The identity is still the right place to look. It just isn't a cut point for every path.

### A greedy plan

With changes listed, a greedy method is easy to follow: repeatedly pick the allowed change that closes the most remaining paths per unit of cost, until no allowed change closes anything.

```python
from dataclasses import dataclass


def edge_key(edge: Edge) -> tuple[str, str, str]:
    return (edge.source, edge.kind, edge.target)


@dataclass(frozen=True)
class Change:
    name: str
    removes: frozenset[tuple[str, str, str]]   # edge keys this change eliminates
    cost: int                                  # ordinal tier used only for comparison: 1 low, 2 medium, 3 high
    removes_required: bool = False             # True if it breaks a confirmed flow or required function
    reversible_by: frozenset[str] = frozenset()  # nodes that could undo the change


def greedy_plan(paths: list[list[Edge]], changes: list[Change]) -> tuple[list[Change], list[list[Edge]]]:
    """Choose changes that close the most paths per unit of cost. Returns (plan, paths left open)."""
    remaining = list(paths)
    allowed = [change for change in changes if not change.removes_required]
    plan: list[Change] = []

    def closes(change: Change) -> int:
        return sum(1 for path in remaining if any(edge_key(e) in change.removes for e in path))

    while remaining:
        useful = [change for change in allowed if change not in plan and closes(change) > 0]

        if not useful:
            break

        # Most paths closed per cost tier; then cheaper; then name, so ties are deterministic.
        best = max(useful, key=lambda c: (closes(c) / c.cost, -c.cost, c.name))
        plan.append(best)
        remaining = [path for path in remaining if not any(edge_key(e) in best.removes for e in path)]

    return plan, remaining
```

This reuses `Edge` from Chapter 4, and the verification and durability checks below reuse its `find_paths` and `STRUCTURAL_KINDS`. Run on the payments paths with the changes from the table, it picks:

1. **Remove `dev-lead` as app owner**: closes P2 and P5 at low cost.
2. **Remove the directory role from `helpdesk-07`**: closes P3 and P6.
3. **Disable shared key access on `custdata`**: closes P1.

P4 is left open, because every change that would close it removes something required. Narrowing `payments-deploy` isn't chosen: once shared key access is disabled, it closes nothing the plan hasn't already closed. Section 9.4 shows why it may still belong in the plan.

The cost numbers (1, 2, 3) are a convenience for comparison, not a measurement. Try changing them. If doubling the cost of one change flips the plan, that's worth knowing, and it's a conversation to have with the people who estimated it.

### Verify the cut against the graph

The greedy method works on the paths you enumerated. Chapter 4's search caps path length, so a cut set computed from enumerated paths can miss a longer route that avoids every chosen change. Always verify by removing the plan's edges from the graph and searching again:

```python
def open_paths_after(edges: list[Edge], plan: list[Change], entries: list[str], targets: list[str]) -> dict:
    """Re-run the Chapter 4 search with the plan's edges removed."""
    removed = set().union(*(change.removes for change in plan)) if plan else set()
    kept = [edge for edge in edges if edge_key(edge) not in removed]
    results = {}

    for entry in entries:
        for target in targets:
            found = find_paths(kept, entry, target, max_hops=12)

            if found:
                results[(entry, target)] = found

    return results
```

Use a higher hop limit for verification than for discovery. Verification asks a yes-or-no question for a handful of entry and target pairs, so it can afford a deeper search. Anything it finds goes back into the plan as an open path.

---

## 9.4 A cut the attacker can undo isn't a cut

The plan above has a flaw that the path graph can't show unless you ask.

Disabling shared key access on `custdata` is a configuration change. Who can change it back? Anyone with write access to the storage account, and that includes `payments-deploy`, which still holds Contributor on the resource group. And P4 is still open: the production pipeline can still become `payments-deploy`. So an attacker who takes over the pipeline can turn shared key access back on, list the keys, and read `custdata`. The plan closed P1 on paper and left it one configuration change away.

The check is mechanical. For each change, record who could reverse it (`reversible_by`). After applying the plan, find every node still reachable from any entry point. If any of them can reverse a change, the change isn't durable:

```python
def reachable_nodes(edges: list[Edge], entries: list[str]) -> set[str]:
    """Every node reachable from the entry points over traversable edges."""
    outgoing: dict[str, list[str]] = {}

    for edge in edges:
        if edge.kind not in STRUCTURAL_KINDS:
            outgoing.setdefault(edge.source, []).append(edge.target)

    seen = set(entries)
    frontier = list(entries)

    while frontier:
        node = frontier.pop()

        for target in outgoing.get(node, []):
            if target not in seen:
                seen.add(target)
                frontier.append(target)

    return seen


def undoable_changes(edges: list[Edge], plan: list[Change], entries: list[str]) -> list[str]:
    """Names of planned changes that an identity still reachable after the plan could reverse."""
    removed = set().union(*(change.removes for change in plan)) if plan else set()
    kept = [edge for edge in edges if edge_key(edge) not in removed]
    reach = reachable_nodes(kept, entries)

    return [change.name for change in plan if change.reversible_by & reach]
```

For the payments plan, this flags the shared key change: `payments-deploy` can reverse it and is still reachable through P4. There are two ways to make the change durable:

- **Narrow `payments-deploy`'s role** so it can't change storage account settings. This was the high-cost change the greedy plan skipped. Now it has a reason.
- **Assign an Azure Policy with a deny effect** that rejects storage accounts with shared key access enabled. Contributor can't modify policy assignments, because the role excludes authorization writes, so `payments-deploy` can't remove it. Microsoft provides a built-in policy definition for this. This is usually cheaper than redesigning the deployment role, and it protects every storage account in scope, not just one.

The CISO's plan in the opening story used the second option. Durability is the reason "disable shared key access" appeared together with "with an Azure Policy assignment" in that plan.

> **As of 2026-10:** Verify the built-in Azure Policy definition for preventing storage account shared key access and its supported effects, and that Contributor lacks `Microsoft.Authorization/policyAssignments/write`.

The general rule: for every change in a plan, ask who can undo it, and whether any of them is still on a path. Configuration-based cuts are especially prone to this. Identity removals usually aren't, unless someone on a remaining path holds a role that can re-grant them.

---

## 9.5 What's left: accepted risk

P4 remains. The production pipeline can become `payments-deploy`, deploy code to `pay-reconcile`, and read the archive through its managed identity. That's the design, and the business needs it.

An open path the business accepts is still a path. It shouldn't vanish from the ranking. It should carry a **risk acceptance**: a human assertion, recorded in your exception register, with:

- the path IDs it covers,
- who accepted it, in what role, and when,
- the reason ("deploying `pay-reconcile` is the pipeline's function"),
- the **compensating controls** relied on, each checkable (for P4: the `production` environment requires two approvals; deployments are logged; `mi-pay-reconcile`'s role is scoped to the one container it reads rather than the whole account),
- an **expiry date**, after which the acceptance must be renewed or the path treated as open.

Two rules keep acceptances honest:

- **Check compensating controls as evidence.** "Two approvals required" is a property of the GitHub environment that a collector can read. Chapter 4's hop H1 carried an unchecked assumption about branch protection. A risk acceptance that relies on approvals should turn that assumption into a checked fact, and lapse if it stops being true.
- **Acceptances come from the register, never from the evidence.** Chapter 8's opening story was an app registration named "approved security exception SEC-1142". An exception is real only if it exists in the register, with an owner who can be asked. Text in tags, names, or descriptions is never an acceptance.

Accepted paths stay in the ranking, marked "accepted until 2027-04-01". They drop below open paths for work planning, and they come back automatically on the expiry date or whenever the path changes.

---

## 9.6 Advisory, not autonomous

Everything so far produces recommendations. Nothing applies them. That's deliberate, and it's the central design choice of this chapter.

It's tempting to let the analysis tool make the fix itself: it already knows what to change. Consider what that would mean.

**The tool would become the most powerful identity in the estate.** To remove role assignments, change storage settings, and edit app ownership across a tenant, it needs roles at least as strong as the ones it removes. It would show up in its own analysis as the top cut point: one identity that can do everything, reachable from wherever the tool runs, by whoever can influence its inputs.

**Its inputs can be manipulated.** Chapter 8 showed injected text changing a model's output. A tool that acts on its conclusions turns that into an attack on your environment.

**Its conclusions can be wrong.** A collection gap, a missed required flow, or a bad cost estimate can turn a good recommendation into an outage. A person who knows the system catches those. Code that doesn't know what it doesn't know won't.

**Change processes exist for reasons.** Review, approval, scheduling, and rollback plans are how organizations make changes safely and accountably. Many control frameworks expect separation of duties between whoever identifies a change and whoever approves and applies it. A tool that bypasses the change process bypasses those controls.

So the analysis side holds **read-only access**: Reader on Azure, the read-only Graph permissions from Chapter 3, read access to the evidence store. Its output is a recommendation record, a draft change, and a ticket. People review it, and the normal pipeline applies it.

---

## 9.7 The recommendation record

Every recommendation should be a structured record that can be reviewed, tracked, and later verified (Chapter 10):

```json
{
  "id": "rec-7f3a91c2",
  "rulesetVersion": "contoso-path-ranking-2026-10-01",
  "snapshotId": "2026-10-06T09-10-00Z-prod",
  "title": "Close two paths to customer data by removing dev-lead as owner of payments-deploy",
  "changes": ["remove-owner-dev-lead"],
  "closes": ["P2", "P5"],
  "remainingAfterPlan": ["P4 (accepted until 2027-04-01)"],
  "preconditions": [
    "Confirm dev-lead does not rotate payments-deploy credentials manually; if so, move rotation to the pipeline first."
  ],
  "change": "terraform/payments/identity.tf (see pull request)",
  "verification": [
    "Re-collected snapshot shows no owner of payments-deploy other than the platform automation identity.",
    "Path search from user:dev-lead to read custdata and read custarchive returns no paths."
  ],
  "rollback": "Re-add dev-lead as owner through the same Terraform change.",
  "owner": "payments platform team",
  "costEstimate": { "tier": "low", "estimatedBy": "payments platform lead", "on": "2026-10-07" }
}
```

A few fields matter more than the rest:

- **`closes` and `remainingAfterPlan`** are what make the record persuasive. They say what the change buys and what it doesn't.
- **`preconditions`** are where most outages are prevented. For disabling shared key access, the precondition is a log query showing no key-authenticated requests over a representative period (Chapters 5 and 6).
- **`verification`** says, in terms the next snapshot can check, what "fixed" will look like. Chapter 10 runs these checks. Without them, closing the ticket is the only evidence the fix happened.
- **`id`** must be stable across runs (section 9.9), so the same recommendation updates one ticket rather than opening a new one every week.

---

## 9.8 Expressing fixes as Terraform

When the estate is managed as code, the fix should be a code change, reviewed and applied like any other. That way the change goes through the same review, plan, approval, and audit trail as everything else, and it doesn't get reverted the next time the pipeline applies the old configuration.

The three changes in the payments plan, as Terraform:

```hcl
# 1. Remove dev-lead as an owner of the payments-deploy app registration.
#    Delete the owner resource; ownership remains with the platform automation identity.
# resource "azuread_application_owner" "payments_deploy_dev_lead" {
#   application_id  = azuread_application.payments_deploy.id
#   owner_object_id = data.azuread_user.dev_lead.object_id
# }

# 2. Replace the tenant-wide directory role with a scoped one for the help desk.
#    (Delete the Cloud Application Administrator assignment; add the narrower role
#    the help desk actually needs, agreed with the identity team.)

# 3. Disable shared key access on custdata, and deny re-enabling it.
resource "azurerm_storage_account" "custdata" {
  # ...existing configuration...
  shared_access_key_enabled = false
}

resource "azurerm_resource_group_policy_assignment" "deny_storage_shared_key" {
  name                 = "deny-storage-shared-key"
  resource_group_id    = azurerm_resource_group.payments_prod.id
  policy_definition_id = var.builtin_policy_storage_prevent_shared_key_id
  parameters           = jsonencode({ effect = { value = "Deny" } })
}
```

> **As of 2026-10:** Verify `azuread_application_owner` and `azuread_directory_role_assignment` in the current `azuread` provider, `shared_access_key_enabled` and `azurerm_resource_group_policy_assignment` in the current `azurerm` provider, and the built-in policy's ID and effect parameter name.

Three practical points:

- **Find the owning repository first.** If `custdata` is defined in a team's Terraform, changing it in the portal creates drift that the next `apply` reverses. Tags, state file locations, and resource naming conventions usually point to the right repository. When nothing does, that's a finding about ownership.
- **Not everything is in code.** Directory role assignments and app ownership often aren't managed by Terraform. For those, the change is a runbook step with the same record: preconditions, the change, verification, rollback. Terraform's `import` blocks can bring existing resources under management when the team is ready.
- **The plan output is evidence.** `terraform plan` shows exactly what will change. Attach it to the pull request and to the recommendation record. It's deterministic output from the provider, which makes it a far better description of the change than any summary.

Chapter 7 covered drafting these changes with a model. Section 9.10 returns to it briefly.

---

## 9.9 Handing off to ITSM

Most organizations track changes in an IT service management (ITSM) system such as ServiceNow, Jira, or Azure DevOps. The recommendation should land there as work the owning team recognizes.

**One ticket per plan step per owning team**, not one per finding. The opening story's forty tickets became three. Each ticket says what it closes.

**The path is the justification.** The ticket description is the recommendation record rendered for the owning team: the outcome in the title ("Close two paths to customer data by removing dev-lead as app owner"), the paths it closes as hop tables with evidence categories, the preconditions, the verification criteria as acceptance criteria, and a link to the evidence. Chapter 7's grounding pattern can write the prose, with the record as the evidence pack and the validator checking the result.

**Owners come from evidence, not guesses.** The owning team comes from ownership metadata, such as tags, a configuration management database, or the Terraform repository's owners. Those are human assertions, so record which source was used. If there's no owner, route to a triage queue and report the missing ownership as a finding.

**Stable IDs prevent duplicates.** The analysis runs every week. Without a stable ID, every run opens new tickets for the same recommendations. Derive the ID from what the recommendation *is*: the changes and the paths' entry and target nodes, not the snapshot or the run:

```python
import hashlib


def recommendation_id(change_names: list[str], path_endpoints: list[tuple[str, str]]) -> str:
    """Same changes for the same entry/target pairs give the same ID, run after run."""
    material = "|".join(sorted(change_names)) + "#" + "|".join(sorted(f"{a}->{b}" for a, b in path_endpoints))

    return "rec-" + hashlib.sha256(material.encode("utf-8")).hexdigest()[:8]
```

Each run then creates the ticket if the ID is new, updates it if the evidence changed, and comments with verification results when a later snapshot shows the paths closed. Closing the ticket is the owning team's job. Confirming the fix is Chapter 10's.

**The integration identity can create and update tickets, nothing else.** It needs no Azure write access. If your ITSM system can trigger automation from tickets, check that a ticket created by the analysis can't trigger a change without human approval. Otherwise you've built the autonomous tool from section 9.6 with an extra step.

---

## 9.10 Where AI fits

Remediation is a good place for models, inside the same boundaries as Chapters 7 and 8:

- **Drafting the change.** A model given the recommendation record can draft Terraform, a runbook, or a change request. `terraform validate` and `plan` check it. A human reviews it.
- **Drafting preconditions.** Models are good at listing categories of things a change might break ("anything using the account keys, including SAS tokens signed with them, and tools such as older backup agents"). They can't check them. Turn each into a query or a question for the owner.
- **Explaining trade-offs.** Given two candidate plans with their closed and remaining paths and cost estimates, a model can write the one-page comparison the CISO asked for, grounded in the records, with every claim cited.
- **Writing tickets** for each audience, from the same record.

And the jobs models shouldn't do:

- **Choosing the cut set.** It's a search over the graph with explicit costs and constraints. Code does it repeatably.
- **Estimating costs or deciding what's required.** Those are human assertions from the people who run the system.
- **Declaring a change safe.** Safety comes from preconditions checked against evidence, and from the plan output.
- **Accepting risk.** Only a person with the authority to accept it can, in the register.

---

## 9.11 Lab: a remediation plan for the payments paths

This lab turns the Chapter 4 graph into a plan, checks it, and produces the artifacts. It uses the companion lab tenant (Appendix A) and your Chapter 4 to 6 lab outputs.

**Step 1 — Rank.** Add consequence, entry exposure, reach, and confidence to each path from Chapter 4's search, using Chapter 5's reachability and Chapter 2's bands. Sort with `rank_key` and record the ruleset version. Change one level, such as making the archive's consequence lower, and see how the order moves.

**Step 2 — List changes.** For every edge on the six paths, write the change that would remove it, its cost tier with who estimated it, and whether it removes something required. Use Chapter 6's confirmed flows to mark required edges.

**Step 3 — Plan.** Run `greedy_plan`. Confirm it picks the owner removal, the directory role removal, and the shared key change, and leaves P4 open. Double the shared key change's cost and run it again. What changes? (With the example tiers, the plan switches to narrowing `payments-deploy`'s role for the third step. Both close P1. Which is right depends on whose estimate you trust, which is exactly the conversation to have.)

**Step 4 — Verify.** Run `open_paths_after` with a hop limit higher than your discovery search. Confirm only P4 remains.

**Step 5 — Check durability.** Fill in `reversible_by` for each change, run `undoable_changes`, and confirm the shared key change is flagged. Add a change for the Azure Policy deny assignment, with an empty `reversible_by`, and rerun.

**Step 6 — Accept the remainder.** Write a risk acceptance for P4 with compensating controls. Make each control checkable: add the GitHub environment's required reviewers to your collector, and confirm the value.

**Step 7 — Produce artifacts.** For each plan step, write a recommendation record with a stable ID from `recommendation_id`. Draft the Terraform (by hand or with a model), run `terraform plan` against the lab, and attach the output. Render one ticket description through Chapter 7's grounded pipeline and validator.

**Step 8 — Re-run.** Run the whole lab again from the same snapshot and confirm the recommendation IDs don't change.

**What you should see.** Six paths become three changes and one accepted risk. The durability check catches a cut that looked complete and wasn't. Convergence tells you where to look, but not what one change can close, because the graph doesn't know which edges the business needs until you tell it.

---

## Summary

- Fix by **cut point**, not by finding: find the few **changes** that close the most important paths at the least cost, and say what remains.
- **Rank paths with explicit, versioned rules** over ordinal factors (consequence, entry exposure, data-plane reach, confidence, length), sorted **lexicographically** rather than by weighted sums.
- Model **changes** rather than edges. Costs are **human estimates**. Changes that remove **confirmed flows or required functions** are excluded.
- A **greedy plan** is explainable and good enough. **Verify** it by re-running the search with the plan's edges removed.
- **A cut the attacker can undo isn't a cut.** Check whether anyone still reachable can reverse each change, and make configuration cuts durable, for example with Azure Policy deny assignments.
- Paths the business needs stay visible as **accepted risk**, with checkable compensating controls and an expiry date, recorded in a register, never inferred from evidence text.
- The analysis tool is **advisory**: read-only access, recommendation records, draft changes, and tickets. People and pipelines apply changes.
- **Recommendation records** carry closed and remaining paths, preconditions, the change, verification criteria, rollback, owner, and a **stable ID**.
- Express fixes as **Terraform** where the estate is code, attach the **plan output**, and hand off to **ITSM** as one ticket per plan step per team.
- Use AI to **draft** changes, preconditions, comparisons, and tickets. Never to choose cut sets, estimate costs, declare safety, or accept risk.

## Key terms

- **Cut point** — a hop where one change breaks a path.
- **Change** — an action a person can take that removes one or more edges.
- **Cut set** — a set of changes that together close every path between chosen entry points and targets.
- **Plan** — an ordered cut set with costs, owners, and the paths left open.
- **Ruleset version** — an identifier for the exact ranking rules applied, recorded with every ranked output.
- **Durable cut** — a change that no identity still on a path can reverse.
- **Risk acceptance** — a recorded human assertion that an open path is tolerated, with compensating controls and an expiry.
- **Recommendation record** — the structured description of a recommended change, its effect, preconditions, verification, and rollback.

---

## Author notes (remove before submission)

- The opening story, cost tiers, and ranking rules are illustrative and fictional. Keep the scope header's statement that they aren't any product's rules.
- Verify: built-in Azure Policy for preventing storage shared key access, its effects, and the definition ID; that Contributor excludes policy assignment writes.
- Verify: `azuread_application_owner`, `azuread_directory_role_assignment`, `azurerm_resource_group_policy_assignment`, and `shared_access_key_enabled` in current provider versions; Terraform `import` block availability.
- Verify: which directory roles can manage application owners, so the `reversible_by` example for owner removal is accurate.
- Add the Chapter 9 fact checks to GTM **M-306** when it is picked up.
