> **Scope:** Glossary first draft for the book draft *Managing Azure Security with AI*: the key terms from every chapter in one alphabetical list, plus the acronyms the book uses. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Glossary

**Spine:** [`../README.md`](../README.md) · **Preface:** [`../front-matter/preface.md`](../front-matter/preface.md)

> *Draft status: first draft, built from the "Key terms" list at the end of each chapter. The chapter number after each entry is where the term is defined and used most. If a chapter's definition changes, change it here too.*

Terms in *italics* inside a definition have their own entry.

---

## A

**Access event** — a specific logged operation at a specific time. Contrast with *capability* and *flow*. *Chapter 8.*

**Access-decision contract** — for one target, the controls that decide access, whether the analysis models each one, and what result an unmodeled instance produces. It keeps "can read" from sounding stronger than the evidence. *Chapter 5.*

**Activity metric** — a measure of work done, such as items closed. Contrast with *outcome metric*. *Chapter 1.*

**AI inference** — an interpretation produced by a model. It isn't guaranteed to be repeatable or traceable, and it is never promoted to an *observed fact*. One of the five *evidence categories*. *Chapter 2.*

**Allowlisted audit fields** — the fixed set of fields an audit record may contain. Anything else is rejected. *Chapter 13.*

**Append-only evidence** — snapshots that can be added but not modified or deleted within the retention period, enforced by an immutability policy. *Chapter 13.*

**Application object** — an app's definition in its home tenant. Federated credentials and owners attach to it. It's joined to its *service principal* by `appId`. *Chapter 3.*

**Attribution** — the ability to tie a logged operation to a specific identity. Shared keys and SAS tokens destroy it. *Chapter 8.*

## C

**Calibration** — agreement between stated probabilities and observed frequencies. Claims rated 70% should turn out true about 70% of the time. *Chapter 10.*

**Capability** — an action a path makes possible, regardless of intent or history. "Can read", not "did read". *Chapter 8.*

**Capability node** — a graph node representing an action that matters, such as reading specific data. Path searches end at capability nodes. *Chapter 5.*

**Change** — an action a person can take that removes one or more edges from the graph. *Chapter 11.*

**Citation** — a reference from a generated sentence to the *evidence pack* item that supports it. *Chapter 9.*

**Collector** — the identity and code that read evidence from Azure and Entra ID. *Chapter 3.*

**Confirmation ladder** — confirming a network path from least intrusive to most: read-only diagnostics, then connection troubleshoot, then a deliberate test. Each rung is authorized in writing and recorded. *Chapter 7.*

**Content-free audit record** — an audit entry holding identifiers, versions, hashes, results, and decisions, but no prompts, packs, or drafts. *Chapter 13.*

**Control plane** — the Azure Resource Manager operations that manage a resource: create, configure, assign roles, list keys. Contrast with *data plane*. *Chapter 4.*

**Control-to-data conversion** — a *control-plane* action that yields *data-plane* access, for example listing a storage account's keys. *Chapter 4.*

**Controlled vocabulary** — an agreed set of words for capability, flow, and activity, enforced in reports. *Chapter 8.*

**Coverage (collection)** — the part of the estate a snapshot actually read, compared with what was expected. Not the same as a *coverage check*. *Chapter 12.*

**Coverage check** — a validation rule requiring certain *evidence pack* items, such as every path and gap, to be cited. *Chapter 10.*

**Cut point** — a hop where one change breaks one or more paths. *Chapters 1 and 11.*

**Cut set** — a set of changes that together close every path between chosen entry points and targets. *Chapter 11.*

## D

**Data plane** — the endpoints where a service's data is read and written, such as blob reads, as opposed to ARM management operations. Control-plane roles don't grant data-plane access unless a *control-to-data conversion* exists. *Chapters 4 to 7.*

**Declared flow** — a *flow* evidenced by configuration: an app setting that names a store, or a data role held by a workload's identity. *Chapter 8.*

**Deployment type** — the Azure OpenAI option that determines where requests may be processed. *Chapter 13.*

**Derived fact** — a claim computed from *observed facts* by an unambiguous rule. One of the five *evidence categories*. *Chapter 2.*

**Deterministic inference** — a repeatable conclusion that depends on stated assumptions. One of the five *evidence categories*. *Chapter 2.*

**Durable cut** — a change that no identity still on a path can reverse. *Chapter 11.*

## E

**Effective access** — what an identity can do at a scope after inheritance, group expansion, role contents, denies, and conditions. *Chapter 4.*

**Eligible assignment** — a Privileged Identity Management (PIM) role that must be activated before use. Eligible isn't active. *Chapter 4.*

**Entry point** — where an attacker could plausibly start: a CI/CD identity, an internet-facing endpoint, a guest account, a developer workstation. *Chapter 1.*

**Evidence category** — how a claim is known: *observed fact*, *derived fact*, *deterministic inference*, *AI inference*, or *human assertion*. Each category has verbs that go with it. *Chapter 2.*

**Evidence legend** — a diagram key that shows the evidence kind of every line. *Chapter 8.*

**Evidence pack** — a small, structured selection of derived claims, paths, gaps, and cut points, with short IDs, sent to a model. *Chapter 9.*

**Excess capability** — a *capability* with no corresponding declared or confirmed *flow*. *Chapter 8.*

**Expected scope** — the subscriptions and directories that *should* be collected, from a source other than the collector itself. *Chapter 3.*

**Exposure window** — how long a path was open, reported as observed lower and upper bounds. *Chapter 12.*

## F

**Fabrication (hallucination)** — plausible content a model produces without a source. *Chapter 10.*

**Federated identity credential** — trust in an external issuer's tokens for a specific *subject*, so a workload such as a GitHub workflow can sign in without a stored secret. *Chapter 4.*

**Flow** — a movement of data a system is designed to perform. Flows are *declared*, *probable*, *observed*, or *confirmed*, depending on the evidence. *Chapter 8.*

## G

**Gap** — evidence that could not be collected, reported explicitly as a result. *Chapter 2.*

**Golden test set** — packs and tasks with expected properties, re-run after every change to a prompt, schema, validator, or model. *Chapter 10.*

**Grounding** — constraining a model to produce output only from supplied evidence, with *citations*. *Chapter 9.*

## H

**Hop** — a relationship that lets someone at one point reach the next. *Chapter 1.*

**Human assertion** — a claim attributed to a named person, with a date, expiry, and scope. One of the five *evidence categories*. *Chapter 2.*

## I

**Indeterminate (reachability)** — the result when an *unmodeled control* or a missing input sits on a network route, such as an appliance whose rules weren't collected. Always reported with its reason; a path through it is *insufficient evidence*. *Chapter 7.*

**Indirect prompt injection** — instructions placed in data that a model later reads, such as a resource tag or a display name, rather than given to the model directly. *Chapter 10.*

**Input span** — the time from the earliest snapshot read behind a derived result, such as a path, to the latest. A snapshot is a set of reads with known times, not a moment. *Chapters 3 and 5.*

**Insufficient evidence** — the honest answer when the evidence can't support a conclusion. It's the lowest *ordinal confidence band*, and the `status` a model returns when an *evidence pack* can't answer the question. *Chapters 2 and 9.*

**Intended, configured, observed, and confirmed reachability** — what should connect, what configuration allows, what logs show did connect, and what a recorded test showed. *Chapter 6.*

## L

**Local authentication** — key-based access to an Azure service, as opposed to Entra ID. Disabled for the tooling. *Chapter 13.*

## M

**Managed identity** — an identity attached to an Azure resource. Code running on that resource can use it. *Chapter 4.*

**Manifest** — a snapshot's description: collector, scope, timing, file hashes, queries, and gaps. *Chapter 3.*

**Metamorphic test** — a test that checks how output should relate across two related inputs, without knowing the exact correct output. For example, reordering the pack shouldn't change which items are cited. *Chapter 10.*

**Model as interface** — using a model to choose deterministic queries and explain their results, rather than to answer from its own knowledge. *Chapter 9.*

## N

**Network security group (NSG)** — prioritized allow and deny rules applied to subnets and network interfaces. *Chapter 6.*

**Not verified** — the verdict when a snapshot can't answer whether a fix worked. Chapter 2's *insufficient evidence*, applied to fixes. *Chapter 12.*

## O

**Observed fact** — a claim read directly from an authoritative source at a known time. One of the five *evidence categories*. *Chapter 2.*

**Ordinal confidence band** — a small, defined set of confidence levels, such as High, Medium, Low, and Insufficient evidence, used instead of uncalibrated percentages. *Chapter 2.*

**Outcome metric** — a measure that decreases only when exposure decreases, such as paths from entry points to targets. *Chapter 12.*

**Owner (application)** — a principal that can manage an app registration's credentials, and so can become its *service principal*. *Chapter 4.*

**Owner-equivalent** — any identity that can obtain Owner at a scope, directly or by granting itself roles. *Chapter 4.*

## P

**Path** — a sequence of *hops* from an *entry point* to a *target*. *Chapter 1.*

**Path postcondition** — a *postcondition* that re-runs the path search between named entry points and targets. *Chapter 12.*

**Plan** — an ordered *cut set* with costs, owners, and the paths left open. *Chapter 11.*

**Position** — where a request originates, such as the internet, a subnet, or on-premises. It decides which data-plane hops the request can use. *Chapter 6.*

**Postcondition** — a statement that must be true after a change, written so that code can test it against a snapshot. *Chapter 12.*

**Posture checklist** — a set of independently evaluated configuration rules: a benchmark, a control set, or a provider's recommendations. *Chapter 1.*

**Private endpoint** — a network interface with a private IP address, connected to one sub-resource of a PaaS service. It doesn't close the service's public endpoint by itself. *Chapter 6.*

**Probable flow** — a *flow* inferred from code, pipelines, or runbooks, often by a model. Labeled AI-inferred until an owner confirms it, and never used to suppress an *excess capability* finding. *Chapter 8.*

**Public network access** — a service setting that decides whether its public endpoint accepts traffic at all. *Chapter 6.*

## R

**Recommendation record** — the structured description of a recommended change: its effect, preconditions, verification, and rollback. *Chapter 11.*

**Regression** — a verified *postcondition* that fails on a later snapshot. *Chapter 12.*

**Risk acceptance** — a recorded *human assertion* that an open path is tolerated, with compensating controls and an expiry. *Chapter 11.*

**Rule of three** — with zero failures in *n* random samples, the 95% upper bound on the failure rate is about 3/*n*. *Chapter 10.*

**Ruleset version** — an identifier for the exact ranking rules applied, recorded with every ranked output. *Chapter 11.*

## S

**Service endpoint** — a subnet setting that lets a service's firewall recognize traffic from that subnet over the service's public endpoint. *Chapter 6.*

**Service firewall** — a PaaS service's own network rules: default action, IP rules, virtual network rules, and bypass. *Chapter 6.*

**Service principal** — an application's identity in a tenant. Azure role assignments point at it. See *application object*. *Chapter 3.*

**Service tag** — a named group of address prefixes maintained by Microsoft, such as `VirtualNetwork` or `Internet`. *Chapter 6.*

**Silent-scope problem** — a query returning results only from the scopes the caller can read, with no indication that others were skipped. *Chapter 3.*

**Snapshot** — a hashed, timestamped package of collected evidence, plus a *manifest* describing it. *Chapter 3.*

**Snapshot diff** — the classification of paths between two snapshots as closed, persisted, unresolved, or new. *Chapter 12.*

**State postcondition** — a *postcondition* about a resource property, such as a setting, assignment, owner, or policy. *Chapter 12.*

**Structured output** — model output constrained to a defined schema, for example sentences with citation lists. *Chapter 9.*

**Subject** — the claim in an external token that identifies what is trusted: a repository, branch, or environment. *Chapter 4.*

**Support checking** — judging whether a sentence's claims follow from the items it cites. *Chapter 10.*

## T

**Target** — an asset whose compromise matters to the organization, sometimes called a crown jewel. *Chapter 1.*

**Temporally inconsistent** — a path whose *input span* is longer than one collector run, or that saw a change on the path inside its span. It is reported as *insufficient evidence* until its inputs are re-collected together. *Chapter 5.*

**Token budget** — a limit on model usage per run or tenant that stops model calls, not checks, when reached. *Chapter 13.*

**Tool calling** — a model selecting a predefined function and arguments, which your code executes. *Chapter 9.*

**Tooling target** — a capability over the security tooling itself, such as reading evidence packs or writing snapshots, added to the path analysis. *Chapter 13.*

**Tooling tenant** — a business unit or customer whose evidence must be isolated from others sharing the same deployment. *Chapter 13.*

**Toxic combination** — conditions that are each tolerable alone but together create a serious exposure. *Chapter 1.*

**Transitive membership** — group membership including members of nested groups. *Chapter 3.*

## U

**Unmodeled control** — a control the derivation found but can't evaluate, such as a role-assignment condition, a missing role definition, or a deny assignment with a condition. The hop is kept and labeled, and a path through it is reported as insufficient evidence. *Chapter 5.*

**Untrusted text** — text in the evidence written by people outside the review, such as tags and display names. It's carried separately from claims and never followed. *Chapter 10.*

**User-defined route (UDR)** — a custom route in a route table, often sending traffic to a firewall. *Chapter 6.*

## V

**Validator** — deterministic code that checks a draft against its pack for rule violations before a person sees it. *Chapter 9.*

## Z

**Zero trap** — treating an unknown value as zero in a score, which hides real risk. *Chapter 2.*

---

## Acronyms

| Acronym | Meaning |
|---------|---------|
| API | Application programming interface |
| ARG | Azure Resource Graph |
| ARM | Azure Resource Manager |
| CI/CD | Continuous integration and continuous delivery |
| CISO | Chief information security officer |
| CSPM | Cloud security posture management |
| CVE | Common Vulnerabilities and Exposures (an identifier for a published vulnerability) |
| DNS | Domain Name System |
| DPO | Data protection officer |
| ITSM | IT service management |
| JSON | JavaScript Object Notation |
| KQL | Kusto Query Language, used by Resource Graph and Log Analytics |
| LLM | Large language model |
| MFA | Multifactor authentication |
| NSG | Network security group |
| OIDC | OpenID Connect |
| PaaS | Platform as a service |
| PIM | Privileged Identity Management |
| RBAC | Role-based access control |
| SAS | Shared access signature |
| SCM | The App Service advanced tools site (Kudu), named for source control management |
| SDK | Software development kit |
| SIEM | Security information and event management |
| SOC | Security operations center |
| TLS | Transport Layer Security |
| UDR | User-defined route |
| VM | Virtual machine |

---

## Author notes (remove before submission)

- Built from the 92 "Key terms" entries across Chapters 1–13, with two duplicates merged ("cut point" from Chapters 1 and 11; "data plane" from Chapters 4 to 7). Added: *evidence category*, *insufficient evidence*, *declared flow*, *probable flow*, and *service principal* as its own entry, because the chapters lean on them without listing them.
- Definitions follow the chapter wording, lightly expanded where a one-line definition needed an example. If a chapter's definition changes, change it here.
- Publishers usually want an index as well as a glossary. Build it from the final page proofs, not from this draft.
