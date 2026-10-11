> **Scope:** Chapter 11 revised draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals. The architecture, retention periods, and budgets here are illustrative examples for the reader, not any product's actual design.
> **Status:** draft — revised (revision pass 1, 2026-10-10)

# Chapter 11 — Governing the AI tooling itself

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: revised (revision pass 1, 2026-10-10). Target 6,000 words. Terraform resource and argument names, Azure OpenAI deployment types and data-handling terms, role names, and private DNS zone names were checked against current documentation in October 2026; dated "As of" notes mark the ones to re-check before submission.*

---

## The map in the log

In this fictional scenario, six months after the payments review, Contoso's security team added a new target to their weekly path analysis: "read evidence packs." It was meant as a formality. The evidence store was locked down, the snapshots were immutable, and the collector held Reader and nothing else.

The search returned 412 identities.

None of them went through the evidence store. They went through the logs. While building the explanation pipeline from Chapter 7, a developer had set the application to log every model request and response at information level, to debug a prompt. The logs went to the team's Application Insights resource, which sent them to a Log Analytics workspace shared by the whole platform engineering department. Everyone in the department's engineering group held Log Analytics Reader on the workspace, so they could look at their own services. The debug setting had never been turned off.

Every week, the workspace received the evidence pack for each audience: the six payments paths with their hops, the gaps showing which subscriptions the collector couldn't read, the accepted risk on P4 with its compensating controls, and the ranked list of what was still open. Four hundred and twelve people could query a ranked list of the easiest ways into Contoso's customer data, along with a note on where the security team had no visibility.

Nobody had done anything malicious. Nobody had done anything unusual. A debug setting, a shared workspace, and a broad reader group: three ordinary decisions, each defensible on its own. It was a toxic combination, in Chapter 1's sense, in the security team's own tooling.

The fix took an afternoon: remove prompt content from the application logs, move the tooling's telemetry to its own workspace, and replace the content with an audit record that holds hashes, versions, and decisions. What took longer was the realization behind it. The team had spent ten chapters building a system that knows more about Contoso's weaknesses than anything else in the company, and they had governed it like an internal dashboard.

This chapter is about governing it like what it is.

---

## 11.1 Why the tooling is a target

Look at what the system built in this book holds and does:

- **A complete privilege graph.** Every identity, every role, every path from an entry point to a target. Chapter 4's graph is exactly the reconnaissance an attacker would otherwise spend weeks building.
- **A ranked list of open paths.** Chapter 9's ranking sorts them by how much damage they allow and how easy they are to start. To an attacker, that's a to-do list.
- **The blind spots.** Chapter 3's gap list says which subscriptions and APIs the defenders can't see.
- **The accepted risks.** Chapter 9's register lists paths the organization has decided to leave open, with the controls it relies on instead.
- **Influence over decisions.** Its reports shape what gets fixed, and its tickets reach change processes.

That gives four kinds of threat, and each maps to something earlier chapters already discussed:

| Threat | Example | Earlier chapter |
|--------|---------|-----------------|
| **Disclosure** | Evidence packs readable in a shared log workspace | Chapter 3 (no secret values), this chapter's opening |
| **Manipulation** | Text in a resource tag steers the model; an edited snapshot hides a path; a relaxed validator rule lets a misstatement through | Chapter 8 |
| **Loss of visibility** | The collector loses access, and the reports show improvement | Chapter 10 |
| **Abuse of its identities** | The collector's Reader at the tenant root used for reconnaissance; the model deployment used for unrelated work at the security team's expense | Chapter 3, this chapter |

The rest of the chapter takes each in turn. The approach is the same one the book uses for everything else: identify what the system must protect, find the paths to it, and cut them.

---

## 11.2 Apply the book to itself

The most useful thing to do with the tooling is to put it in its own analysis. Add a small set of **tooling targets** to the target list from Chapter 1, and let the weekly search find paths to them like any other:

| Target capability | Why it matters | Typical routes |
|-------------------|----------------|----------------|
| Read snapshots or evidence packs | Disclosure of the map | Data roles on the evidence store, log workspaces, backups, exports |
| Write or delete snapshots | Hide a path, fake a fix | Data roles on the evidence store, lifting the immutability policy |
| Change prompts, validator rules, or ranking rules | Change what reports say | Write access to the repository and its deployment pipeline |
| Read model logs or stored outputs | Disclosure | Log Analytics roles, diagnostic settings |
| Act as the collector identity | Reconnaissance with tenant-wide Reader | Federated credentials, owners of its app registration |
| Call the model deployment | Cost, and access to whatever the deployment can see | Cognitive Services roles, API keys if local auth is enabled |

These are ordinary Azure and Entra capabilities, so Chapter 4's derivation already produces most of the edges. Data roles on a storage account produce `grants`. Owners of the collector's app registration produce `canAddCredential`. Contributor on the tooling's resource group produces the ability to change its configuration. The search doesn't need to know the target is special.

Two kinds of route need extra collection:

- **Log workspaces.** Add the tooling's Log Analytics workspaces and Application Insights resources to the collector, with their role assignments, and treat "read logs from workspace W" as a capability. If the application writes evidence content to a workspace, add a `grants` edge from that capability to "read evidence packs." The opening story's 412 identities came from exactly that edge.
- **The repository and pipeline.** Prompt templates, validator rules, and ranking rules live in source control. Who can merge to the main branch, and which pipeline identity deploys the result, are paths to "change what reports say." Collect them from your source control system the same way Chapter 9 collected GitHub environment protection rules.

Then hold the results to the same standard as any other target. A path to "write snapshots" is at least as serious as a path to customer data, because it lets an attacker hide every other path. Rank it with Chapter 9's rules, give it to an owner, and verify the fix with Chapter 10's postconditions.

---

## 11.3 Identities and least privilege

The tooling has several components, and each needs a different identity. Giving them one shared identity is the most common mistake, because it makes every component as powerful as the most privileged one.

| Component | Identity | Needs | Must not have |
|-----------|----------|-------|---------------|
| **Collector** | Managed identity or workload identity federation (Chapter 3) | Reader on Azure scopes; read-only Graph application permissions; append access to the snapshot container | Any write role on Azure; `listKeys`; Graph write permissions; delete on snapshots |
| **Derivation and ranking** | Managed identity | Read snapshots; write derived results to a separate container | Write to snapshots; any Azure or Graph access |
| **Explanation pipeline** | Managed identity | Read derived results; call the model deployment | Read raw snapshots it doesn't need; any Azure write |
| **Review interface** | Entra ID sign-in for people, with app roles | Show results to authorized reviewers; record approvals | Direct access to storage for users |
| **ITSM integration** | Managed identity or a narrowly scoped service account | Create and update tickets (Chapter 9) | Any Azure write; ticket-triggered automation without approval |
| **Administrators** | People, through Privileged Identity Management | Eligible roles for maintenance, activated with approval and time limits | Standing Owner or Contributor on the tooling |

A few points deserve emphasis.

**No keys anywhere.** Disable shared key access on the evidence storage account, and disable local (API key) authentication on the Azure OpenAI resource. Every caller then authenticates with Entra ID, so every call is tied to an identity, every permission is an RBAC role assignment that the collector can read, and there's no key to leak. Chapter 4 showed what shared keys do to a path graph: anyone who can list them holds the data plane. The tooling shouldn't recreate that pattern for its own data.

**The model caller needs a data-plane role only.** On Azure OpenAI, the built-in **Cognitive Services OpenAI User** role allows calling deployments without managing the resource. The explanation pipeline needs that and nothing more. Contributor on the resource would let it change deployments and network settings. The setting that turns off API keys is the resource's `disableLocalAuth` property (`local_auth_enabled = false` in Terraform).

**Separate the collector from everything else.** The collector's identity is the most powerful one in the system: Reader across the estate plus directory read permissions. It should do nothing except collect. If the derivation code ran under the collector's identity, any bug or injected input in derivation would run with tenant-wide read access.

**Append-only for snapshots.** The collector needs to add snapshots, never modify them. A container with a time-based immutability policy enforces that at the storage layer: once written, a blob can't be overwritten or deleted until the retention period ends. That holds even for an account owner only once the policy is **locked**. An unlocked policy can be shortened or removed by anyone with permission to manage it, which is exactly the "lifting the immutability policy" step in the table above. Test the policy unlocked, then lock it. Locking is irreversible: afterward the period can be extended but never shortened. That's what makes Chapter 3's hashes trustworthy. The manifest proves the files haven't changed, and the policy makes changing them impossible within the retention period.

**People get eligibility, not standing access.** Administrators of the tooling should hold eligible roles through Privileged Identity Management, activated for a stated reason, with approval for the most powerful ones. Chapter 4's Rule 5 said eligible isn't active, and the search shouldn't treat it as active. It should still report eligible paths separately, because activation is one step away.

---

## 11.4 Network: no public endpoints

Chapter 5's opening story was a storage account with a private endpoint and public network access still enabled. The tooling's own resources are the place to get that right.

- **Private endpoints** for the evidence storage account (the `blob` sub-resource), the Azure OpenAI resource (the `account` sub-resource), and any Key Vault the tooling uses.
- **Public network access disabled** on each of them. A private endpoint adds a private route. It doesn't remove the public one.
- **Private DNS zones** linked to the tooling's virtual network, so that names resolve to the private addresses: `privatelink.blob.core.windows.net` for blob storage and `privatelink.openai.azure.com` for Azure OpenAI. Chapter 5's section on DNS applies: if a component resolves the public name, it will try the public route and fail, or worse, succeed from somewhere it shouldn't.
- **Compute integrated with the virtual network**, so the collector, derivation, and explanation components reach those endpoints privately. Outbound traffic from them should go only where it needs to: Azure Resource Manager, Microsoft Graph, the private endpoints, and your ITSM system.

Then check it with Chapter 5's own query. Run the "private endpoint exists but public access isn't disabled" query against the tooling's resource group, and require it to return nothing. Add that as a Chapter 10 postcondition, re-checked on every snapshot, so a debugging session that turns public access back on shows up as a regression within a day.
Private endpoints have a cost: each endpoint is billed hourly, plus data processed, and private DNS zones add a small monthly charge. For a system that holds a ranked list of an organization's weaknesses, that's an easy trade. It's also the main reason to keep the tooling's footprint small: three or four endpoints, not one per microservice.

---

## 11.5 What goes to the model, and where it goes

### Minimize the pack

Chapter 7's evidence pack was designed to be small, and Chapter 8 made it smaller: placeholders instead of names where names aren't needed, structured fields instead of free text, no tags or descriptions copied verbatim. Those choices were made for accuracy and injection resistance. They also limit disclosure. Every field left out of the pack is a field that can't leak through the model service, its logs, or a cache.

Ask, for each field, whether the explanation needs it:

- **Resource and identity names.** Often needed for an engineer's ticket, rarely for a board summary. Use placeholders such as "APP-1" and "User A" for audiences that don't act on the specific resource, and substitute the names back in after validation, outside the model.
- **Object IDs and subscription IDs.** Almost never needed for prose. Keep them in the record, not the pack.
- **Personal data.** User names and email addresses appear in privilege graphs because people hold roles. Use a role-based description ("the payments team's developer lead") or a placeholder unless the audience needs the person.
- **App setting names.** Chapter 3 left keeping setting names as a governance choice, but App Service returns names and values together from an operation that Reader can't call. If you approve a separately privileged collection step, discard values before anything is persisted. Keep only the names your engineers need in snapshots, and leave them out of packs for audiences that don't.
- **Secret values.** Never. Chapter 3 kept them out of snapshots, so they can't reach a pack. Keep it that way when someone proposes "just adding the connection string so the model can explain it."

### Residency and processing location

Azure OpenAI offers several deployment types, and they differ in where requests may be processed. A **Standard** deployment processes requests within the geography you deploy in. **Data Zone** deployments may process them anywhere in a defined zone, such as the US or the EU. **Global** deployments may process them in any region where the model is available. All of them store data at rest in the resource's geography. Which one satisfies your obligations is a question for your privacy and legal teams, and the answer should be recorded as a decision, with the deployment type pinned in Terraform so it can't drift.

> **As of 2026-10:** Which deployment types each model offers, and in which regions, changes often. Check the model availability table for your region before you pin a type.

The same question applies to the evidence store, logs, and backups. A snapshot is personal data in most jurisdictions, because it names people and what they can do. Store it in a region you've chosen deliberately, and make sure geo-redundant replication doesn't copy it somewhere you haven't.

### Data handling terms

Chapter 7 listed the questions to settle: what the service retains, whether prompts are used for training, and what abuse monitoring applies. For security evidence, abuse monitoring deserves particular attention. Some monitoring involves storing prompts for a period and, in limited cases, human review. If that's unacceptable for your evidence, apply for modified abuse monitoring, which is a Limited Access program with eligibility criteria, and record which terms apply.

> **As of 2026-10:** Abuse monitoring retention and the modified abuse monitoring eligibility criteria are contractual terms that Microsoft revises. Re-read them when you renew.

### Retention, immutability, and erasure

Immutability and data protection pull in opposite directions. Chapter 3 wanted snapshots that can't be changed. Privacy law may require deleting personal data when it's no longer needed. Resolve the conflict by design rather than by exception:

- **Set the immutability period to the evidence need**, such as the audit period you must be able to reproduce, not "forever."
- **Keep personal data out of snapshots where you can.** Object IDs plus a separately stored, separately governed directory lookup let you show names when needed and delete the lookup when the person leaves, without touching immutable files.
- **Delete on schedule** after the immutability period ends, with a lifecycle policy rather than a person remembering.

---

## 11.6 Audit without a second copy of the map

The tooling must be auditable. When someone asks why a report said what it said, you need to show which snapshot, which pack, which prompt, which model version, which validator result, and who approved it. The opening story shows the wrong way to get that: log everything, and create a second, poorly protected copy of the evidence.

There's a better way, and it follows from choices the book has already made. **Snapshots are immutable, and packs are deterministic derivations of them.** Given the snapshot ID and the version of the pack builder, you can regenerate the exact pack at any time. The audit trail doesn't need the pack's contents. It needs enough to regenerate it and prove the regeneration matches: the snapshot ID, the builder version, and a hash of the pack.

Model outputs are different. They're not reproducible, because the same pack can produce different text. But only the **approved** output matters as evidence, and it's an artifact you're keeping anyway: it's the report or ticket that was sent. Store it with the same protection as the snapshots, not in a log.

So the audit record holds identifiers, versions, hashes, results, and decisions, and nothing else:

```python
import hashlib
import json
import re

# Fields an audit record may contain. Anything else is rejected, so content can't creep in.
AUDIT_FIELDS = frozenset({
    "correlationId", "tenantId", "snapshotId", "packBuilderVersion", "packSha256",
    "audience", "promptTemplateVersion", "modelDeployment", "modelVersion",
    "validatorVersion", "validatorProblems", "attempt", "outputSha256",
    "inputTokens", "outputTokens", "reviewer", "decision", "contentRetained", "atUtc",
})
COUNT_FIELDS = frozenset({"validatorProblems", "attempt", "inputTokens", "outputTokens"})
HASH_FIELDS = frozenset({"packSha256", "outputSha256"})
FLAG_FIELDS = frozenset({"contentRetained"})
DECISIONS = frozenset({"approved", "rejected", "pending"})
# Every other field is an identifier, version, or timestamp: short and without spaces, so prose can't fit.
IDENTIFIER = re.compile(r"[A-Za-z0-9._:@/+-]{1,128}")
SHA256_HEX = re.compile(r"[0-9a-f]{64}")


def sha256_of(value: object) -> str:
    """Stable hash of a JSON-serializable value: same content, same hash, regardless of key order."""
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def audit_value_problem(name: str, value: object) -> str | None:
    """Return why a value doesn't fit its field, or None if it does."""
    if name in COUNT_FIELDS:
        # bool is a subclass of int in Python, so exclude it explicitly.
        ok = isinstance(value, int) and not isinstance(value, bool) and value >= 0
        return None if ok else "must be a non-negative integer"

    if name in FLAG_FIELDS:
        return None if isinstance(value, bool) else "must be true or false"

    if not isinstance(value, str):
        return "must be a string"

    if name in HASH_FIELDS:
        return None if SHA256_HEX.fullmatch(value) else "must be a SHA-256 hex digest"

    if name == "decision":
        return None if value in DECISIONS else f"must be one of {', '.join(sorted(DECISIONS))}"

    return None if IDENTIFIER.fullmatch(value) else "must be a short identifier with no spaces"


def audit_record(**fields: object) -> dict:
    """Build an audit record. Unknown fields and free-text values raise, so a prompt or a draft can't be logged by accident."""
    unknown = sorted(set(fields) - AUDIT_FIELDS)

    if unknown:
        raise ValueError(f"not allowed in an audit record: {', '.join(unknown)}")

    problems = [f"{name} {problem}" for name, value in fields.items() if (problem := audit_value_problem(name, value))]

    if problems:
        raise ValueError("; ".join(problems))

    return dict(fields)
```

A record for one draft looks like this:

```python
record = audit_record(
    correlationId="run-2026-10-20-0412",
    tenantId="contoso",
    snapshotId="2026-10-20T14-02-00Z-prod",
    packBuilderVersion="pack-builder-1.6.0",
    packSha256=sha256_of({"packId": "contoso-payments-2026-10-20", "items": ["..."]}),
    audience="board",
    promptTemplateVersion="board-summary-v4",
    modelDeployment="explain-prod",
    modelVersion="2026-08-06",
    validatorVersion="validator-2.3.1",
    validatorProblems=0,
    attempt=1,
    outputSha256=sha256_of({"sentences": ["..."]}),
    inputTokens=2140,
    outputTokens=312,
    reviewer="user:security-architect-02",
    decision="approved",
    contentRetained=False,
    atUtc="2026-10-20T15:11:09Z",
)
```

`validatorProblems` is a count, not the problem text. The problem messages quote the draft ("number not in pack: 85%"), so they're content too. If you need the messages to debug, keep them for a short period in a restricted location, as described below.

The allowlist is the important design choice. A blocklist ("don't log prompts") fails the first time someone adds a field called `context` or `debugPayload`. An allowlist fails closed: a new field needs a code change, and the review of that change is where someone asks whether it's content.

Allowing a field name isn't enough on its own. Without a check on the value, a caller in a hurry can put a whole draft into `decision` or `reviewer`, and the allowlist passes it. So each field also has a shape: counts are non-negative integers, hashes are SHA-256 digests, `decision` comes from a fixed set, and everything else is a short identifier with no spaces. A sentence doesn't fit any of those shapes.

### When you need content

Sometimes you do need the content: to debug a prompt, to investigate a misstatement that reached a reader, or to build the Chapter 8 test set. Make that an exception with its own controls:

- **A separate, restricted store**, not the shared log workspace. Access through an eligible role, activated for a stated reason.
- **Short retention**, measured in days, enforced by a lifecycle policy.
- **Encryption at rest with keys you control**, if your policy requires it.
- **Opt-in per run**, recorded in the audit record by the `contentRetained` flag, so you can see when content was kept. The reason belongs with the activation request for the restricted store, not in the audit record.

### Check your platform's logs

Your application isn't the only thing that can log content. Check every component on the request path:

- **The model service's diagnostic logs.** Find out what each log category records, and send it only to the tooling's own workspace. The `RequestResponse` category can include request and response payloads, so treat it as content.
- **API gateways.** If you put API Management or another gateway in front of the model, check whether it logs request and response bodies. Gateways often can, and teams often turn it on to debug. API Management's option to log LLM prompts and completions is off by default; make sure it stays that way.
- **Application telemetry.** SDKs and logging frameworks may capture request bodies or exceptions that include them. The opening story's leak came from here.

Then add the log workspaces to the tooling targets from section 11.2, and let the path search tell you who can read them.
---

## 11.7 Isolation when the tooling is shared

If one deployment of the tooling serves several business units, subsidiaries, or customers, each of them is a **tenant** of the tooling, and a leak between them is a disclosure of one organization's weaknesses to another. That's a more serious failure than most bugs, and it needs defenses at more than one layer:

- **Storage.** Separate containers per tenant at minimum, with RBAC scoped to the container, or separate storage accounts when the separation must hold even against a misconfigured role at the account level.
- **Every record carries its tenant.** Snapshots, derived results, packs, audit records, and tickets all include a tenant ID, and every query filters on it.
- **One tenant per model call.** Never put evidence from two tenants in one context, even for a comparison. The model can't keep them apart reliably, and the output can't be validated against a single pack.
- **Caches keyed by tenant.** A cached explanation is evidence. A cache hit across tenants is a leak, however well the rest is isolated.
- **Tests for leakage.** Build a test that runs two tenants with deliberately similar evidence and checks that no output, cache entry, or audit record for one contains an identifier from the other.

Layered defenses matter here because each layer fails differently. Application filters fail through bugs, storage permissions through misconfiguration, and caches through key design. Any one layer may fail. All three failing together is much less likely.

Chapter 8's injection threat crosses tenant lines too. If any field in one tenant's evidence could reach another tenant's pack, an instruction planted by someone in the first could steer reports for the second. One tenant per call prevents it.

---

## 11.8 Cost control

The model is rarely the biggest cost. Packs are small, explanations are short, and the work runs once per snapshot. Log ingestion, private endpoints, and storage often cost more. But model costs are the ones that can grow without anyone noticing: a retry loop, a page that regenerates explanations on every view, or a well-meaning integration that calls the deployment for every ticket comment.

Three controls cover most of it.

**Cache by everything that determines the output.** An explanation depends on the tenant, the pack, the audience, the prompt template, and the model version. Whether it may be served also depends on the validator that approved it. If none of those changed, the explanation doesn't need to be regenerated:

```python
def explanation_cache_key(tenant_id: str, pack_sha256: str, audience: str, prompt_version: str, model_version: str, validator_version: str) -> str:
    """Every input and policy version governing a cached explanation is part of the key."""
    parts = [tenant_id, pack_sha256, audience, prompt_version, model_version, validator_version]

    if any(not part for part in parts):
        raise ValueError("every cache key part is required")

    return "explain:" + ":".join(f"{len(part)}:{part}" for part in parts)
```

Using the pack hash rather than the snapshot ID means an unchanged pack from a new snapshot is a cache hit, which is the common case for a stable estate. Including the prompt and model versions means a change to either regenerates everything, which is what you want after an upgrade. Including the validator version means that tightening a rule invalidates every explanation the old rules approved, instead of letting them keep coming back as cache hits. Including the tenant is the isolation rule from section 11.7. Each part is prefixed with its length, so no choice of IDs can make two different sets of inputs produce the same key. With a plain `:` join, tenant `a:b` with pack `c` and tenant `a` with pack `b:c` would collide. Cache only explanations that passed validation and were approved, so the cache can't serve a draft that a reviewer rejected.

**Budget tokens, and fail closed.** Give each run and each tenant a token budget. When it's exhausted, the pipeline stops calling the model and reports "explanation unavailable" for the remaining items. It must never skip validation or review to save tokens, or fall back to an unvalidated cached draft:

```python
class TokenBudget:
    """Tracks token use for one run. Reserves each call's worst case first, so the limit can't be overshot."""

    def __init__(self, limit: int) -> None:
        if limit <= 0:
            raise ValueError("limit must be positive")

        self.limit = limit
        self.used = 0
        self.reserved = 0

    def reserve(self, input_tokens: int, max_output_tokens: int) -> int | None:
        """Reserve the most a call can use. Returns the reservation, or None if the call must not be made."""
        if input_tokens < 0 or max_output_tokens <= 0:
            raise ValueError("token counts must be positive")

        worst_case = input_tokens + max_output_tokens

        if self.used + self.reserved + worst_case > self.limit:
            return None

        self.reserved += worst_case

        return worst_case

    def settle(self, reservation: int, actual_tokens: int) -> None:
        """Replace a reservation with the usage the response reported."""
        self.reserved -= reservation
        self.used += actual_tokens

        if actual_tokens > reservation:
            raise RuntimeError("usage exceeded the reservation; the output cap was not enforced")
```

The reservation is the worst case, not a guess. Count the input with the model's tokenizer, and pass `max_output_tokens` to the service as the request's output-token limit, so the service enforces it. Call only if `reserve` returns a reservation, then `settle` it with the usage the response reports, which releases the unused part. An estimate can be low; a reservation the service enforces can't be exceeded. If `settle` ever raises, the output cap wasn't sent, and that's a bug to fix, not a rounding error. Chapter 7's retry limit, at most two corrections, is part of the budget too. A draft that fails validation three times is a signal about the pack or the prompt, not a reason to spend more.

**Use the smallest model that passes the test set.** Not every job needs the largest model. Classifying a change note's type or extracting fields from a ticket can use a smaller, cheaper model. Writing a board summary may need a larger one. Decide with Chapter 8's test set: run each candidate model against it, and pick the cheapest one that passes. That turns a cost decision into an evidence-based one, and it gives you a ready answer when a model version is retired.

Set an Azure Cost Management budget on the tooling's resource group with alerts at thresholds you choose, and treat an unexplained jump as an incident. It usually means a loop, and occasionally it means someone else is using your deployment.

---

## 11.9 Everything in Terraform

The tooling's security depends on settings that are easy to change in the portal and hard to notice afterward: public network access, local authentication, shared key access, diagnostic destinations. Define all of it in Terraform, deploy it through a reviewed pipeline, and let drift detection and Azure Policy keep it that way.

A minimal module for the two resources that hold the most sensitive data:

```hcl
# Evidence store: Entra ID only, no public endpoint, append-only snapshots.
resource "azurerm_storage_account" "evidence" {
  name                            = var.evidence_account_name
  resource_group_name             = azurerm_resource_group.tooling.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "ZRS"     # zone-redundant; stays in the chosen region
  shared_access_key_enabled       = false
  public_network_access           = "Disabled"
  allow_nested_items_to_be_public = false
  min_tls_version                 = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }
}

resource "azurerm_storage_container" "snapshots" {
  name                  = "snapshots"
  storage_account_id    = azurerm_storage_account.evidence.id
  container_access_type = "private"
}

resource "azurerm_storage_container_immutability_policy" "snapshots" {
  storage_container_resource_manager_id = azurerm_storage_container.snapshots.id
  immutability_period_in_days           = var.snapshot_retention_days
  protected_append_writes_enabled       = true
  # Irreversible: once locked, the period can be extended but never shortened or removed.
  # Apply with false first, check the retention period, then set true.
  locked = true
}

# Model service: no API keys, no public endpoint, pinned model version.
resource "azurerm_cognitive_account" "openai" {
  name                          = var.openai_account_name
  resource_group_name           = azurerm_resource_group.tooling.name
  location                      = var.location
  kind                          = "OpenAI"
  sku_name                      = "S0"
  custom_subdomain_name         = var.openai_account_name   # required for Entra ID auth and private endpoints
  local_auth_enabled            = false
  public_network_access_enabled = false
}

resource "azurerm_cognitive_deployment" "explain" {
  name                 = "explain-prod"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.model_name
    version = var.model_version   # pinned; upgrades go through the test set (Chapter 8)
  }

  sku {
    name = var.deployment_type    # recorded residency decision (section 11.5)
  }
}

resource "azurerm_private_endpoint" "openai" {
  name                = "pe-${var.openai_account_name}"
  resource_group_name = azurerm_resource_group.tooling.name
  location            = var.location
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "openai"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "openai"
    private_dns_zone_ids = [azurerm_private_dns_zone.openai.id]
  }
}

resource "azurerm_role_assignment" "explainer_calls_model" {
  scope                = azurerm_cognitive_account.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_user_assigned_identity.explainer.principal_id
}
```

The blob private endpoint, the private DNS zones and their virtual network links, the remaining role assignments, the log workspace, and the diagnostic settings follow the same pattern.

Two provider details matter. Storage accounts take `public_network_access = "Disabled"`, while Cognitive Services accounts take `public_network_access_enabled = false`; the two resources use different argument shapes. And because the storage account rejects shared keys, set `storage_use_azuread = true` in the `azurerm` provider block, so Terraform itself uses Entra ID for blob operations. The identity running Terraform then needs a storage data-plane role.

> **As of 2026-10:** Arguments checked against the `azurerm` provider documentation in October 2026. Re-check them against the provider version you pin.

Three practices make the module more than a template.

**Back it with policy.** Terraform defines the intended state. Azure Policy assignments with deny effects keep it. Deny storage accounts with shared key access or public network access enabled, and deny Cognitive Services accounts with local authentication or public network access enabled, at the tooling's resource group or above. This is Chapter 9's durable cut applied to the tooling: a debugging session can't turn public access back on, even with Contributor.

**Verify it like any other fix.** Write Chapter 10 postconditions for the module's security settings: shared key disabled, local auth disabled, public access disabled, the immutability policy present and locked, the role assignments exactly as defined. Re-check them on every snapshot. The tooling's own configuration is part of what it verifies.

**Review changes to the module as security changes.** A pull request that adds a diagnostic setting, a role assignment, or a network rule to the tooling changes who can see the map. Require review from the security team, not just the platform team.

---

## 11.10 The pipeline's logic is production code

The prompts, validator rules, ranking rules, postconditions, and model version together decide what the tooling tells people. Changing any of them changes what reports say, so each change gets the same discipline as a change to a production system:

- **Version everything, and record the versions.** The audit record from section 11.6 carries the prompt template, validator, pack builder, and model versions. Chapter 9's ranking output carries the ruleset version. A report you can't tie to versions can't be reproduced or defended.
- **Change through pull requests.** Prompt templates and validator rules live in source control, not in a configuration screen. The repository's branch protection is a security control, and section 11.2 puts it in the path analysis.
- **Gate on the test set.** Chapter 8's test set runs on every change to a prompt, the validator, or the model version, and a regression blocks the merge.
- **Two people for relaxations.** A change that loosens a validator rule, removes a ranking factor, or drops a postcondition makes the tooling more permissive. Require a second reviewer from outside the author's team. Relaxing Chapter 8's instruction-pattern check to cut false positives, for example, would quietly reopen the attack from that chapter's opening story.
- **Model upgrades are changes.** A new model version can change wording, citation habits, and failure modes. Deploy it beside the current one, run the test set and a sample of real packs through both, compare, and switch only after review. Record the decision.

---

## 11.11 Where AI fits

The governance work itself is a reasonable place for models, under the same rules as everywhere else:

- **Drafting the Terraform and policy definitions** for the tooling, checked by `terraform validate`, `plan`, and review.
- **Reviewing pull requests to prompts and validator rules** for changes that make the pipeline more permissive, as a prompt to the human reviewer, not a replacement for one.
- **Summarizing audit records**: "which prompt versions had the highest validator failure rate this month?" over the structured audit store is ordinary grounded summarization.
- **Generating leakage and injection test cases** for section 11.7 and Chapter 8.

And the jobs models shouldn't do:

- **Granting access to the tooling or its data.** That's an access decision, made by people through PIM and access reviews.
- **Approving changes to prompts, validator rules, or the model version.** A model reviewing changes to the pipeline that constrains models has an obvious conflict.
- **Reading the content store** to answer questions, unless a person has activated access for that purpose. The restricted content store from section 11.6 isn't a retrieval index.

---

## 11.12 Lab: govern the lab tooling

This lab deploys the tooling's core resources with the controls from this chapter, then points the book's own methods at them. It uses the companion lab tenant (Appendix A) and your lab outputs from Chapters 3 to 10.

**Step 1 — Deploy.** Apply the Terraform module from section 11.9 in a separate resource group, completed with the blob private endpoint, the private DNS zones and links, and a dedicated Log Analytics workspace. Use a user-assigned managed identity for each component in section 11.3. Set `locked = false` on the immutability policy for the lab, or a short `snapshot_retention_days`. A locked policy keeps the storage account from being deleted until the retention period ends.

**Step 2 — Prove key authentication is disabled.** If your lab operator can list the storage account's keys, try to use one for a data-plane request, and try to call the Azure OpenAI deployment with an API key. Both key-authenticated calls should fail. Then call the deployment with the explanation pipeline's managed identity from inside the virtual network, and confirm it succeeds. Call it from outside, and confirm it fails.

**Step 3 — Run Chapter 5's check.** Run the "private endpoint exists but public access isn't disabled" query against the tooling's resource group, and confirm it returns no rows. Temporarily enable public network access on the storage account in the portal, and confirm that the policy denies it.

**Step 4 — Add the tooling targets.** Add the targets from section 11.2 to your Chapter 4 target list, extend the collector to read the tooling's log workspace and its role assignments, and run the search. List every identity with a path to "read evidence packs" or "write snapshots." Compare the list with who you expected.

**Step 5 — Reproduce the opening story.** Configure the explanation pipeline to log request bodies to a workspace that a broad group can read, and add the corresponding `grants` edge. Re-run the search, count the identities that can now read evidence packs, and record the number. Then remove the content logging, replace it with `audit_record`, and confirm the count drops back.

**Step 6 — Test the audit allowlist.** Try to build an audit record with a `prompt` or `draft` field, and confirm `audit_record` raises. Regenerate a pack from a past snapshot ID and builder version, hash it with `sha256_of`, and confirm it matches the `packSha256` in the audit record.

**Step 7 — Cache and budget.** Run the explanation pipeline twice on the same snapshot and confirm the second run is all cache hits. Change the prompt template version and confirm it regenerates everything. Set a `TokenBudget` lower than one run needs and confirm the pipeline reports "explanation unavailable" for the remaining items rather than skipping validation.

**Step 8 — Verify the tooling with Chapter 10.** Write postconditions for the module's security settings, re-collect, and verify them. Then change one setting outside Terraform (with the policy temporarily exempted), re-collect, and confirm the postcondition reports a regression.

**What you should see.** The tooling shows up in its own path analysis, with a short, explainable list of identities that can reach its data. The content logging step makes that list jump, and the audit record design brings it back. Keys and public endpoints are absent, and the policy keeps them absent. The tooling's configuration is verified by the same postconditions it runs on everything else.

---

## Closing the loop

The book began with a checklist that scored well while a path to customer data stayed open. It ends with a system that finds paths, explains them with cited evidence, ranks them with explicit rules, cuts them with changes people can review, verifies the cuts against the next snapshot, and treats itself as a target.

Every step rests on the same division of labor. Deterministic code collects, derives, searches, ranks, and verifies, and it can say exactly what it saw and what it couldn't see. Models write: explanations, drafts, tickets, and summaries, grounded in evidence packs and checked by validators. People decide: what matters, what to change, what risk to accept, and whether a draft says the right thing.

That division is the argument of the book. Models make security work faster to communicate. They don't make it true. What makes it true is evidence you can cite, categories that tell readers how much to trust each claim, and verification that doesn't take anyone's word for it, including the tooling's own.

---

## Summary

- The AI tooling holds the **privilege graph, the ranked open paths, the blind spots, and the accepted risks**. Govern it as one of the most sensitive systems you run.
- Its threats are **disclosure, manipulation, loss of visibility, and abuse of its identities**.
- **Put the tooling in its own path analysis** with tooling targets: read evidence, write snapshots, change prompts or rules, read model logs, act as the collector, call the model.
- Give **each component its own identity** with least privilege. **No keys**: disable shared key access and local authentication. Keep snapshots **append-only** with an immutability policy. Give administrators **PIM eligibility**, not standing access.
- **No public endpoints**: private endpoints, public network access disabled, private DNS zones, and Chapter 5's check run against the tooling itself.
- **Minimize the pack**, choose the model's **deployment type and region** deliberately, settle **data handling and abuse monitoring** terms, and resolve **immutability against erasure** by design.
- **Audit without content.** Packs are reproducible from immutable snapshots, so audit records hold IDs, versions, hashes, results, and decisions, enforced by an **allowlist**. Keep content only by exception, restricted and short-lived. Check every component's logs.
- When the tooling is shared, isolate **tenants** in storage, records, model calls, caches, and tests.
- Control cost with **cache keys** that include every input and the tenant, **token budgets that fail closed**, and the **smallest model that passes the test set**.
- Define everything in **Terraform**, back it with **deny policies**, and verify it with **Chapter 10 postconditions**.
- Treat prompts, validator rules, rankings, and model versions as **production code**: versioned, reviewed, tested, with two people for relaxations.

## Key terms

- **Tooling target** — a capability over the security tooling itself, such as reading evidence packs or writing snapshots, added to the path analysis.
- **Append-only evidence** — snapshots that can be added but not modified or deleted within the retention period, enforced by an immutability policy.
- **Local authentication** — key-based access to an Azure service, as opposed to Entra ID; disabled for the tooling.
- **Deployment type** — the Azure OpenAI option that determines where requests may be processed.
- **Content-free audit record** — an audit entry holding identifiers, versions, hashes, results, and decisions, but no prompts, packs, or drafts.
- **Allowlisted audit fields** — the fixed set of fields an audit record may contain; anything else is rejected.
- **Tooling tenant** — a business unit or customer whose evidence must be isolated from others sharing the same deployment.
- **Token budget** — a limit on model usage per run or tenant that stops calls, not checks, when reached.

---

## Author notes (remove before submission)

- The opening story, identity counts, versions, and budgets are illustrative and fictional. Keep the scope header's statement that they aren't any product's design.
- Verified 2026-10-10 (revision pass 1): Cognitive Services OpenAI User role; `disableLocalAuth`; private endpoint sub-resources and private DNS zones; deployment types and processing locations; abuse monitoring and modified abuse monitoring; `RequestResponse` payload logging; API Management LLM logging off by default; locked vs unlocked immutability (text corrected).
- Verified 2026-10-10 (revision pass 1): section 11.9 Terraform arguments, including storage `public_network_access` (corrected from `public_network_access_enabled`), the immutability policy resource, the cognitive deployment `sku` block, the private endpoint `account` sub-resource, and `storage_use_azuread`.
- Consider a reference architecture figure with Azure icons (permitted in architectural diagrams under Microsoft's terms), showing the components, identities, private endpoints, and the content-free audit path.
- Add the Chapter 11 fact checks to GTM **M-306** when it is picked up.
