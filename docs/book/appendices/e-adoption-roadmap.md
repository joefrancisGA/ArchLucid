> **Scope:** Appendix E first draft for the book draft *Managing Azure Security with AI*: an adoption roadmap for a platform team taking the book's method from the lab to a first pilot. Approval package, decisions, and a 30/60/90-day plan drawn from Chapters 3–13. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Appendix E — Adoption roadmap

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Lab:** [Appendix A](a-companion-lab.md) · **Queries:** [Appendix B](b-query-cookbook.md) · **Prompts:** [Appendix C](c-prompt-patterns.md)

> *Draft status: first draft. Every decision and control here comes from a chapter; this appendix orders them. It hasn't been used to run a real pilot yet, so the periods in section E.7 are a planning shape, not a measured duration.*

The chapters explain how to build the reasoning system: collect evidence, derive paths in code, ask a model to explain them, check the explanation, and verify the fixes. A platform team that wants to try it will ask different questions. What do we deploy first? Who has to approve the collector? Where does the evidence live, and for how long? What does the first quarter look like, and how do we know whether to keep going?

This appendix answers those questions in the order a team meets them. It adds no new technique. Each section points back to the chapter that does the work, so you can lift the approval package (section E.2) into a request and the plan (section E.7) into a project, and follow the links when someone asks why.

Everything below is Azure-native, and every infrastructure element is representable in Terraform. The tooling module is Chapter 13, section 13.9. The lab estate you can practice against is Appendix A. Nothing here needs Terraform beyond those two.

---

## E.1 Pilot scope and success criteria

Start small enough that one team can read everything the pilot produces.

**Choose one business unit or one set of subscriptions.** Pick an estate with a team that owns it, a CI/CD pipeline that deploys to it, and data someone would care about losing. A payments platform like Contoso's is a good shape. A shared landing zone with fifty owners isn't, because nobody will own the findings.

**Write the target list before you collect anything.** Chapter 1, section 1.7 described the first week: name the targets (customer data stores, signing keys, the ability to deploy to production, privileged directory roles) and the entry points (CI/CD identities, guests, internet-facing endpoints). Keep it short. Four or five targets are enough for a pilot, and the arguments about what belongs on the list are the most useful part of the first month.

**State success as outcomes, not counts.** A pilot succeeds if it shows the method working on your estate, not if it finds a particular number of paths. Write the criteria so a sponsor can check each one:

- **Paths found and explained.** The search found paths to the named targets, each with hops, evidence categories, and a reviewed explanation (Chapters 5 and 9).
- **Gaps reported.** Every scope or API the collector couldn't read appears as a gap, and no report presents a gap as a clean result (Chapter 3, Chapter 12, section 12.4).
- **At least one cut verified.** One recommendation went through your normal change process, and a later snapshot confirmed its postconditions (Chapters 11 and 12).
- **The tooling governed.** The tooling's own targets are in the path analysis, and the list of identities that can reach its data is one the team expected (Chapter 13, section 13.2).

Don't set a target number of paths, a percentage reduction, or a time-to-fix figure before you've seen the first snapshot. You don't have a baseline yet, and a number invented in a planning meeting becomes the thing people optimize. Chapter 12, section 12.6 explains why counts make poor headlines. Record the first snapshot's numbers as the baseline, and set targets from there if the pilot continues.

---

## E.2 The collector approval package

The collector is the first thing an identity team has to approve, and the first thing a security architect will question. It reads the whole estate, so it's one of the most valuable identities you'll create (Chapter 3, Chapter 13, section 13.1). This section is written so you can paste it into an approval request.

### What is requested

| Item | Request | What it reads | Source |
|------|---------|---------------|--------|
| **Identity** | One user-assigned managed identity if the collector runs in Azure; workload identity federation if it runs in a CI system | Nothing by itself. No secret or certificate to store, rotate, or leak [S1] | Chapter 3, section 3.2 |
| **Azure Resource Manager** | Built-in **Reader** at the pilot's subscriptions or management group | Resource configuration, role assignments, role definitions, network settings. Grants read actions, not the list-secrets actions services expose separately [S2] | Chapter 3, section 3.2 |
| **Microsoft Graph** | `Application.Read.All` (application permission) | App registrations, service principals, federated identity credentials [S3] | Chapter 3, section 3.2 |
| **Microsoft Graph** | `GroupMember.Read.All` (application permission) | Group memberships, including nested membership [S3] | Chapter 3, section 3.2 |
| **Microsoft Graph** | `User.Read.All` (application permission) | Users referenced by memberships and role assignments [S3] | Chapter 3, section 3.2 |
| **Microsoft Graph** | `RoleManagement.Read.Directory` (application permission) | Entra directory role assignments and PIM eligibility [S3] | Chapter 3, section 3.2 |
| **Evidence store** | Append access to the snapshot container only | Nothing; it writes new snapshots and can't overwrite or delete them | Chapter 13, section 13.3 |

Every Graph application permission needs admin consent [S4], so the identity team's approval is the consent itself. If they prefer a narrower grant for eligibility, `RoleEligibilitySchedule.Read.Directory` reads eligibility alone [S3], as Chapter 3 notes.

### What isn't requested, and why

Say what you're not asking for. It answers the reviewer's next question before they ask it.

- **`Directory.Read.All`.** It covers the four permissions above and more. The narrower set is enough for the paths in the pilot, and it's easier to justify (Chapter 3, section 3.2).
- **The App Service application-settings list action.** Reader can see an app's configuration but not the values of its settings [S5]. Listing them returns names and values together, and values are often secrets. The collector stays away from secret values entirely (Chapter 3; Chapter 13, section 13.5).
- **`AuditLog.Read.All`.** Last sign-in time lives in the user's `signInActivity`, which needs this permission [S6]. The pilot doesn't need it: "no recent sign-in" stays a reported gap, as in Appendix B, section B.4. Add it later only if a path template depends on sign-in recency, and request it as a separate change.
- **Any write role, `listKeys`, or Graph write permission.** The collector never changes anything. Remediation is advisory and goes through your change process (Chapter 11, section 11.6).

### Where it runs and how it's reviewed

- **Where.** In the tooling's own resource group, integrated with a virtual network that reaches the evidence store and model service through private endpoints (Chapter 13, section 13.4). If it runs in a CI system instead, the federated credential's subject pins it to one repository and one branch or environment (Chapter 3).
- **Who owns it.** A named owner on the security engineering team. The app registration's owners are themselves a path to the collector's access (`canAddCredential`, Chapter 4, section 4.3), so keep that list to the owner and a deputy.
- **How it's reviewed.** The collector's identity is a tooling target in the path analysis (Chapter 13, section 13.2), so every weekly run reports who can act as it. Add its role assignments and Graph permissions to your regular access review, and re-approve them if the scope widens (section E.8).
- **How it's withdrawn.** Remove the Reader assignment and revoke the Graph consent. Snapshots already collected stay in the immutable store until their retention period ends (section E.3).

---

## E.3 Evidence store and retention

Chapter 13 designed the evidence store, and this appendix doesn't repeat it: Entra ID only, no shared keys, no public endpoint, snapshots in a container with a locked time-based immutability policy, and an audit record that holds hashes and versions instead of content (Chapter 13, sections 13.3–13.6). The Terraform is in section 13.9.

What the design leaves to you are three decisions. Record each one with its owner and date, because a later reviewer will ask.

| Decision | Options to consider | Who decides |
|----------|---------------------|-------------|
| **Retention period** | Long enough to reproduce any report you might be asked to defend, such as your audit period; not "forever." The immutability period is set to this value [S7] | Security engineering with your records or compliance owner |
| **Who can read snapshots** | Only the derivation component and named reviewers. Snapshots name people and their access, so they're personal data in most jurisdictions | Data owner and privacy team |
| **Residency** | The storage region; whether replication may leave it; which model deployment type, since deployment types differ in where requests are processed [S8] | Privacy and legal |

Two cautions apply before you lock anything. A locked immutability policy can be extended but never shortened or removed [S7], so test it unlocked first. And a locked policy keeps the storage account from being deleted until the period ends, which matters if the pilot stops (section E.8).

**Security.** The store holds a ranked list of your weaknesses. Its readers are a tooling target, and the path analysis reports them every week (Chapter 13, section 13.2).

**Scalability.** Snapshots are small JSON files, one set per collection run. Growth is linear in runs and estate size. Blob storage won't be the limit; the review queue will be (section E.5).

**Reliability.** Zone-redundant storage keeps the store available through a zone failure without copying it out of the region, which is why the module uses it (Chapter 13, section 13.9). If the store is unavailable, the collector should fail the run and record it, not write snapshots somewhere else.

**Cost.** Storage for snapshots is small. The private endpoints and private DNS zones that protect it are billed hourly and monthly [S9], and they usually cost more than the storage. Keep the footprint to the three or four endpoints Chapter 13 lists.

---

## E.4 The first path templates

Ship the templates the preface's Scope section marks **fully modeled** first. They rest on evidence the collector in section E.2 already reads, and the chapters have derivations and lab tests for them.

| Template | Entry | Target | Hops | Where it's built |
|----------|-------|--------|------|------------------|
| **CI/CD federated identity to data** | Workflows that a federated credential trusts, by repository and branch or environment | A storage account or container holding sensitive data | `canSignInAs` → role assignment → `grants` | sections 4.3 and 5.3 (Contoso's P1) |
| **App owner and directory role takeover** | A user who owns an app registration, or holds a directory role that can add credentials to it | Whatever the app's service principal can reach | `ownerOf` or directory role → `canAddCredential` → `canSignInAs` → role assignment | Chapter 4, section 4.3 (P2, P3) |
| **Workload identity to data** | Anyone who can deploy code to a Function App or App Service | Data its managed identity can read | deployment action → `runsAs` → `grants` | Chapter 4, section 4.3 (P4); Chapter 8 for the flows |
| **Network conditions on the above** | Any of the above | The same targets | Each data hop is `reachable`, `notReachable`, or `indeterminate`, with a reason | Chapter 7, sections 7.1 and 7.4 |

Leave the partially modeled domains, such as PIM eligibility, Key Vault, and Graph application permissions, for after the pilot. The preface's Scope section gives a template for each. Adding them before the first four work just adds paths nobody has learned to read.

Two rules from the chapters apply to every template from the first day. A path that crosses a role condition, a deny assignment the model can't evaluate, or an indeterminate network hop reports **insufficient evidence**, not "open" or "closed" (Chapter 5, section 5.6). And a path through a scope the collector couldn't read is a gap, not an absence (Chapter 3).

---

## E.5 Review and remediation workflow

Name the roles before the first report goes out. Each one below is a role, not a product, and one person can hold more than one in a small pilot, as long as the author and the approver of any one item differ.

| Role | Does | Chapter |
|------|------|---------|
| **Pipeline operator** | Runs collection, derivation, and drafting; watches gaps and budgets | 3, 7, 11 |
| **Reviewer** | Reads model drafts against the evidence pack before anything leaves the team. Fully reviews anything for executives, auditors, or customers; reviews flagged drafts; samples the rest | 7, 8 (sections 10.8 and 10.9) |
| **Owning team** | Receives recommendations as tickets, decides how to make the change, applies it through its normal pipeline | 9 |
| **Change approver** | Approves the change under your existing change process. Not the person who identified it | 9 (section 11.6) |
| **Risk acceptor** | Accepts a path the business needs, with compensating controls and an expiry date, in the exception register | 9 (section 11.5) |
| **Verifier** | Confirms the fix from a later snapshot, and reports gaps as "not verified" | 10 |

The flow follows the book's order:

1. **Derive and draft.** The weekly run produces paths and draft explanations. Nothing goes to an owning team until a reviewer has read it (Chapter 9, section 9.5; Chapter 10, section 10.9).
2. **Recommend.** Chapter 11 turns the paths into a small plan of cut points. Each plan step becomes one ticket per owning team in your ITSM system, with a stable ID so weekly runs update tickets instead of duplicating them (Chapter 11, section 11.9).
3. **Change.** The owning team makes the change through its own pipeline. The analysis tooling holds no write access, and its ITSM integration can create and update tickets but can't trigger an unapproved change (Chapter 11, sections 11.6 and 11.9).
4. **Verify.** The next snapshot checks the recommendation's postconditions. A closed ticket isn't a verified fix; a passed postcondition is (Chapter 12, sections 12.1–12.3).
5. **Report.** Outcome metrics, with coverage shown next to every number (Chapter 12, sections 12.6 and 12.7).

**Watch the review queue.** If reviewers approve everything without comment, the review has stopped working, whatever the approval rate says. Chapter 10, section 10.8 has the remedies: planted errors, targeted review, and less volume per reviewer.

---

## E.6 Model governance gates

The model, the prompts, and the validator decide what the reports say, so changes to them go through gates like any production change (Chapter 13, section 13.10).

- **Golden and metamorphic tests.** Build the golden set from the pilot's first reviewed packs, and add Chapter 10's metamorphic tests (Chapter 10, section 10.10). Run both on every change to a prompt, the model or its version, the pack builder, or the validator, and weekly to catch drift you didn't cause. A regression blocks the merge.
- **Templates as code.** Every prompt template is a versioned file in source control with its test set named in its header (Appendix C, section C.11). The audit record carries the template, schema, and model versions for every output (Chapter 13, section 13.6).
- **Pinned model versions.** Pin the model version in Terraform (Chapter 13, section 13.9). An upgrade is a change: run the test set and a sample of real packs through both versions, compare, and switch after review [S10].
- **A second reviewer** from outside the author's team for any change that relaxes the pipeline: loosening a validator rule, removing a check, dropping a coverage requirement or a postcondition, or removing a ranking factor (Chapter 13, section 13.10; Appendix C, section C.11).

Who holds the gates matters as much as what they check. The repository's branch protection and the pipeline that deploys the templates are paths to "change what reports say," so they're tooling targets too (Chapter 13, section 13.2).

---

## E.7 A 30/60/90-day plan

The periods are a planning shape. A team that already has a CI/CD estate defined in Terraform may move faster, and one waiting on Graph consent may move slower. What matters is the order: decide, deploy, read, then widen.

| Period | Deployed | Decided | Measured |
|--------|----------|---------|----------|
| **Days 1–30: foundations** | The tooling module from Chapter 13, section 13.9, in its own resource group, with private endpoints and deny policies; the collector identity with the section E.2 permissions; collection only, no model yet | Pilot scope and target list (section E.1); the approval package (section E.2); retention, readers, and residency (section E.3); role holders (section E.5) | Collection coverage: subscriptions read against expected, and each gap. The first baseline snapshot |
| **Days 31–60: first paths** | Derivation for the section E.4 templates; the explanation pipeline with a pinned model; the golden set from the first reviewed packs; ticket creation in your ITSM system | Which paths are accepted risks, with owners and expiry dates; the review sampling policy (Chapter 10, section 10.9); the token budget per run | Paths and entry–target pairs per target, with coverage; reviewer findings per draft; the tooling's own paths (Chapter 13, section 13.2) |
| **Days 61–90: closing the loop** | Postconditions for the first recommendations; scheduled test runs; the tooling's own postconditions (Chapter 13, section 13.9) | Whether to expand, hold, or stop (section E.8) | Verified cuts; time to verify; regressions; coverage trend (Chapter 12, section 12.6) |

**Security.** The tooling is deployed with its controls in the first period, before it holds any evidence. Don't defer private endpoints or the deny policies to "after the pilot." The opening story of Chapter 13 is what that looks like.

**Scalability.** Not a concern at pilot scale: one estate, one weekly run, a handful of templates. The constraint that appears first is reviewer time, so section E.8 makes review capacity an expansion criterion. Chapter 13, section 13.7 covers isolation when the tooling later serves several business units.

**Reliability.** A failed collection run is a gap, reported as one, not a quiet week. Measure it from the first period. The pipeline fails closed: when the token budget runs out, it reports "explanation unavailable" instead of skipping validation (Chapter 13, section 13.8).

**Cost.** The private endpoints and log ingestion usually cost more than the model at pilot scale (Chapter 13, section 13.8). Set an Azure Cost Management budget with alerts on the tooling's resource group in the first period [S11], and treat an unexplained jump as an incident. Model cost depends on your model, region, and run size; estimate it from the first month's token usage rather than in advance.

---

## E.8 Expansion criteria and stopping conditions

Decide in advance what would make you widen the pilot, and what would make you stop. Otherwise the decision gets made by momentum.

### Widen the scope when

- **Collection coverage is stable.** Several consecutive runs read every expected scope, or report the same understood gaps.
- **Gaps are understood.** Each remaining gap has a cause and an owner, and none is growing without explanation.
- **Verification works.** Recommendations are being verified from snapshots, and a regression has been caught at least once, even if you planted it.
- **Review keeps up.** Reviewers are reading drafts, finding real issues, and catching planted errors (Chapter 10, section 10.8).
- **The tooling's own paths are governed.** The list of identities that can reach its data is short, explained, and stable.

Widen one dimension at a time: more subscriptions, or more templates, or more audiences, not all three. Re-approve the collector's scope when the subscriptions change, and add the partially modeled templates from the preface's Scope section as their evidence becomes reliable.

### Stop or roll back when

- **The tooling's own paths can't be governed.** If the path analysis keeps finding broad access to snapshots, logs, or the collector identity, and the team can't close it, the tooling is a liability. Stop collection until it's fixed.
- **Review queues aren't read.** Drafts are approved without comment, or planted errors go through. The output can't be trusted, whatever the dashboard says.
- **Gaps keep growing.** Coverage falls run over run and nobody can say why. The reports increasingly describe an estate you can't see, which is Chapter 12's "improvement" that's really lost visibility.
- **Recommendations are never verified.** Tickets close, postconditions never pass or never run. You've rebuilt the checklist the book started with.

Stopping is an ordinary outcome. Withdraw the collector's access (section E.2), keep the snapshots until their immutability period ends, and record what you learned. If the policy is locked, the storage account stays until then, so include that in the pilot's cost estimate from the start (section E.3).

---

## Sources

- **[S1]** Managed identities for Azure resources. Microsoft Learn. <https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview> Checked 2026-10-12. Kind: documented.
- **[S2]** Azure built-in roles for General (Reader). Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/general#reader> Checked 2026-10-12. Kind: documented.
- **[S3]** Microsoft Graph permissions reference. Microsoft Learn. <https://learn.microsoft.com/graph/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S4]** Overview of Microsoft Graph permissions. Microsoft Learn. <https://learn.microsoft.com/graph/permissions-overview> Checked 2026-10-12. Kind: documented.
- **[S5]** Azure permissions for Web and Mobile. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/permissions/web-and-mobile> Checked 2026-10-12. Kind: inference, from S2.
- **[S6]** user resource type. Microsoft Learn. <https://learn.microsoft.com/graph/api/resources/user> Checked 2026-10-12. Kind: documented.
- **[S7]** Immutable Storage for Blob Data Overview. Microsoft Learn. <https://learn.microsoft.com/azure/storage/blobs/immutable-storage-overview> Checked 2026-10-12. Kind: documented.
- **[S8]** Understanding deployment types in Microsoft Foundry Models. Microsoft Learn. <https://learn.microsoft.com/azure/foundry/foundry-models/concepts/deployment-types> Checked 2026-10-12. Kind: documented.
- **[S9]** Azure Private Link Cost Optimization Principles. Microsoft Learn. <https://learn.microsoft.com/azure/private-link/private-link-cost-optimization> Checked 2026-10-12. Kind: documented.
- **[S10]** Foundry Models lifecycle and support policy. Microsoft Learn. <https://learn.microsoft.com/azure/ai-services/openai/concepts/model-retirements> Checked 2026-10-12. Kind: documented.
- **[S11]** Tutorial: Create and manage budgets. Microsoft Learn. <https://learn.microsoft.com/azure/cost-management-billing/costs/tutorial-acm-create-budgets> Checked 2026-10-12. Kind: documented.

---

## Author notes (remove before submission)

- 2026-10-12 (BR-09): first draft. Every control and decision is taken from Chapters 3–13 and Appendices B and C; the appendix orders them and adds the approval-package framing, the role table, and the expansion and stopping criteria. Added 11 sources, all reused from Chapters 3, 10, and 13 and Appendix B except the managed identities overview and the Cost Management budgets tutorial. Changed: none. Softened: none. Unverified: none.
- The 30/60/90 periods are a planning shape, not a measured duration. Replace them with a real pilot's timeline, or keep the hedge, before submission. Don't add benchmark numbers (paths found, reduction percentages, time to fix) unless they come from a pilot with a source.
- E.4's template table names the Contoso paths (P1–P4) where they illustrate a template. If Chapter 5's path IDs change, update them here.
- E.2's permission table must match Chapter 3, section 3.2. If Chapter 3 changes the Graph set, change it here, and re-check that the "isn't requested" list still holds.
- E.4 and E.8 depend on the preface's Scope section. Re-check them whenever a domain moves between fully and partially modeled.
