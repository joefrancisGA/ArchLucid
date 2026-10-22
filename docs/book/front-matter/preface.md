> **Scope:** Preface first draft for the book draft *Managing Azure Security with AI*: who the book is for, what it teaches, how to read it, and the conventions it uses. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Preface

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Glossary:** [`../back-matter/glossary.md`](../back-matter/glossary.md)

> *Draft status: first draft. See the author notes at the end.*

Most Azure estates are already inspected by tools that produce long lists of findings. Many are now also summarized by language models that turn those lists, or the raw configuration behind them, into confident paragraphs. Both are useful. Neither, on its own, answers the question a security team is paid to answer: **who can reach what, how do we know, and did our fix actually close it?**

This book is about answering that question in Azure and Microsoft Entra ID, and about using AI to help without letting it decide what's true.

## The idea in one sentence

AI is useful in Azure security when it **explains evidence**, and dangerous when it **replaces evidence**.

Everything else follows from that. You collect evidence with read-only access, and you record what you couldn't collect. You compute paths from it in code, where the reasoning is repeatable. You label every claim by how it's known. A model explains the result from a small, cited selection of that evidence, a validator checks what the model wrote, and a person decides. After a change, the next snapshot says whether it worked.

```text
evidence  →  paths (code)  →  evidence pack  →  model draft  →  validator  →  human
    ↑                                                                          │
    └───────────────────────  next snapshot verifies the change  ←─────────────┘
```

None of the steps is new on its own. What the book adds is the discipline of keeping them separate, so that a model's fluency never gets promoted to a fact, and a missing piece of evidence never gets reported as a clean result.

## Who this book is for

The book is written for **Azure security architects and cloud platform engineers** with two or more years of hands-on Azure experience. You should be comfortable with resource groups, role assignments, app registrations, and virtual networks, and able to read PowerShell, Python, KQL, and Terraform. You don't need to be a data scientist or to have built anything with a language model before.

It's also written for **security leaders who have to judge AI security tooling**: whether to buy it, build it, or trust what it says. You can skip most of the code. The chapters on evidence (2), on where models help and hurt (9 and 10), and on verification and governance (12 and 13) give you the questions to ask, and the answers to expect from a tool that's doing it properly.

## What you'll be able to do

By the end, you should be able to:

1. Collect Azure and Entra ID evidence with a dedicated, read-only, secretless identity, and treat what you couldn't read as a result rather than an omission.
2. Reason about **paths** — sequences of identity, network, and data hops from an entry point to something that matters — instead of independent checklist items.
3. Label every claim by how it's known: observed fact, derived fact, deterministic inference, AI inference, or human assertion. Use the words that go with each.
4. Use language models to explain, translate for an audience, summarize, and draft, with citations a machine can check, while keeping ranking, decisions, and changes with people and code.
5. Recommend the fewest changes that close the most paths, hand them off as advisory changes, and verify them against the next snapshot instead of trusting "fixed".
6. Govern the AI tooling itself, which ends up holding a map of your weaknesses.

## Scope

The method applies to any Azure path, but the book models a specific part of Azure: Entra identities, Azure RBAC, CI/CD federation, and data access to platform services, with the network controls in front of them. The table says what that covers. **Fully modeled** means collected, derived into the path graph, and present in the lab. **Partially modeled** means discussed, collected, or derived only in part. **Out of scope** means the book doesn't model it; the method still applies, but you'd add the hops yourself.

| Domain | Status | Where, or why not |
|--------|--------|-------------------|
| Entra users, groups, and service principals | Fully modeled | Chapter 3 collects them; Chapter 5, section 5.3 turns them into `memberOf` and `appFor` edges; Appendix B, section B.4 |
| App registrations and federated identity credentials | Fully modeled | Chapter 4, section 4.3 (`ownerOf`, `canAddCredential`, `canSignInAs`); Chapter 3 for GitHub subjects; Appendix B, section B.4 |
| Managed identities | Fully modeled | Chapter 4, section 4.3 (`runsAs`); Appendix B, sections B.4 and B.5 |
| Azure RBAC role assignments, definitions, and conditions | Fully modeled | sections 4.2 and 5.3; conditions are labeled, not evaluated (section 5.6, access-decision contract); Appendix B, section B.3 |
| Deny assignments | Partially modeled | Collected and derived (Chapter 5, Appendix B, section B.3), but not in the lab: in generally available scenarios Azure creates and manages them, and you can't create your own directly [S1] |
| Privileged Identity Management (PIM) eligibility | Partially modeled | Chapter 4, Rule 5 and the access-decision contract; collection recipes in Appendix B, sections B.3 and B.4; not in the section 5.3 derivation or the lab |
| Storage data access | Fully modeled | Chapter 4, section 4.5 (data roles, key listing); Chapter 6, section 6.3; Chapter 8 (`StorageBlobLogs`); the lab's `custdata` |
| App Service and Function Apps | Fully modeled | Chapter 4 (`canControlCode`, `runsAs`); Chapter 6 (access restrictions, SCM site, virtual network integration); Chapter 8 (app settings as declared flows) |
| Virtual networks, NSGs, Azure Firewall network rules, private endpoints, and private DNS | Fully modeled | Chapter 6, sections 6.4 and 6.5, and Chapter 7, section 7.1, including what the model doesn't evaluate (application and DNAT rules, appliances); Appendix B, section B.7 |
| Key Vault | Partially modeled | Network settings in Chapter 6; the access-policy conversion in Chapter 4, section 4.5; Appendix B, section B.5; the lab's vault is hygiene noise, not on a path |
| Azure SQL Database | Partially modeled | Network exposure in Chapter 6, section 6.3 and Appendix B, section B.7; the Entra admin conversion in section 4.5 is illustrative; data access isn't derived |
| Cosmos DB | Out of scope | Mentioned only as having its own network settings (Chapter 6) |
| AKS and Kubernetes RBAC | Out of scope | Kubernetes appears only as an external issuer for federated credentials |
| VMs and VM extensions | Partially modeled | Run command and extensions are listed as code control (Chapter 4, section 4.3), and the VM access extension as a conversion (section 4.5); the lab's VMs are network positions in Chapter 7, not identity hops |
| Azure DevOps | Out of scope | The federated credential hop is generic (section 4.3), but project, pipeline, and service connection permissions aren't collected (section 5.7) |
| Azure Container Registry | Out of scope | Not discussed |
| Cross-tenant access | Partially modeled | Guests are collected (Appendix B, section B.4) and can be entry points; cross-tenant access settings and multitenant applications aren't collected |
| Conditional Access and workload identity policies | Out of scope | Not modeled; the access-decision contract (section 5.6) says a path is reported even if a policy would block the sign-in |
| Automation accounts and runbooks | Partially modeled | Listed as code control (Chapter 4, section 4.3, and the lab's deployment-actions table); the lab uses one only to host the collector |
| Microsoft Graph application permissions | Partially modeled | Collected (Chapter 3; Appendix B, section B.4) and described as privilege (Chapter 4, section 4.4), but the section 5.3 derivation doesn't turn them into edges |

Three of the partial rows are short additions to Chapter 5's graph, if your estate needs them:

- **PIM eligibility.** Add a `canActivate` edge from each eligible principal to the scope, for Azure roles and directory roles. The edge kind is already in section 5.2's table. The evidence comes from the eligibility recipes in Appendix B, sections B.3 and B.4. Treat activation requirements, such as approval or multifactor authentication, as an unmodeled control on the edge, so a path through it reads "Insufficient evidence" until someone checks them.
- **Graph application permissions.** For each service principal's app role assignments on Microsoft Graph (Appendix B, section B.4), add the edges that section 4.4 describes: `Application.ReadWrite.All` gives `canAddCredential` to every application, `RoleManagement.ReadWrite.Directory` gives the ability to assign any directory role, and `AppRoleAssignment.ReadWrite.All` lets the principal grant itself either [S2]. Each is a derived fact from the assignment.
- **Key Vault.** Add `grants` edges for reading secrets: from access policies on vaults that use the access-policy model, or from Key Vault data roles on vaults that use Azure RBAC. Add the section 4.5 conversion for anyone who can write a vault's access policies. Appendix B, section B.5 says which model each vault uses.

## How to read it

Chapter 1 explains how the four parts fit together. Four reading paths work well:

- **Front to back.** The chapters build on each other, and one fictional estate, Contoso's payments platform, runs through all of them. Its evidence is collected in Chapter 3, its six paths are derived in Chapter 5, and they're explained by a model in Chapter 9, attacked through its own metadata in Chapter 10, cut in Chapter 11, and verified in Chapter 12. This is the path for engineers who will build something.
- **The evaluator's path.** Chapters 1, 2, 9, 10, 12, and 13, plus the table of patterns that look useful and aren't in Appendix C, and Appendix E's adoption roadmap. This is the path for leaders assessing a product or an internal proposal.
- **If you're planning a pilot.** Read Chapter 1, then Appendix E, which orders the decisions and controls from Chapters 3 to 13 into an approval package and a 30/60/90-day plan. Follow its links into the chapters as each decision comes up.
- **If you already do attack-path work.** Start with Chapter 2, then read Part III (Chapters 9 and 10) and Part IV (Chapters 11 to 13). Dip into Chapters 4 to 8 where the Azure details are new to you.

Every chapter ends with a summary, key terms, and a lab. The [glossary](../back-matter/glossary.md) collects the key terms in one place.

## The companion lab

Every technique in the book runs against a small companion lab: an Azure estate defined in Terraform, with Contoso's six paths, Chapter 6's network mistakes, and enough ordinary hygiene noise to make Chapter 1's point. Appendix A describes what it builds, what it costs, how each chapter changes it, and how to tear it down. Appendix B collects the queries, and Appendix C the prompts.

**The lab is deliberately vulnerable.** It creates users who can take over an application, an identity that can read customer data stores, and storage open to the internet. Deploy it only into a tenant and subscription you use for nothing else, put no real data in it, and destroy it when you finish a session. Chapter 10's lab plants instructions in resource tags. Do that only in the lab, never in resources that other people's tooling reads.

The labs in Chapters 9, 10, and 13 need a language model deployment. Any deployment that supports structured output will do [S3]. Use the lab's synthetic data unless your organization has explicitly approved sending real evidence to that deployment.

## Conventions

- **Contoso is fictional.** So are its people, incidents, and numbers. Where a figure illustrates a point, the text says it's illustrative. Where something comes from my own experience rather than a source, the text says that too.
- **Evidence labels.** Claims in examples carry the evidence category from Chapter 2. Model output in examples is labeled as model output, and AI inferences are marked "(AI-inferred)", the same way the book asks you to label them.
- **Path and hop labels.** Chapter 2 numbers the hops of the single opening path 1 to 8. From Chapter 9 onward, the whole payments graph uses the IDs in Chapter 9's evidence pack: hops H1–H9, paths P1–P6, gaps G1–G2, and cut point C1. The appendices use those IDs too.
- **Dated notes.** Azure, Entra ID, and model services change constantly. Behavior that might have changed by the time you read this sits in a note that starts **As of 2026-10**. Check those against current Microsoft documentation before you rely on them.
- **Code.** Examples are complete enough to run against the lab, and short enough to read. They're teaching code. They handle the traps the text discusses, such as paging, gaps, and absent properties, but they aren't hardened products. Collection code is read-only. The only code that changes anything is the lab's Terraform, which you apply yourself.
- **Names in the lab.** Storage account and app names must be unique across Azure [S4], so the lab adds a short suffix. Appendix A's `book_names` output maps each book name to yours.

## What this book isn't

It isn't a catalog of Azure security controls or a walkthrough of a benchmark. Those exist, and Chapter 1 explains why they're necessary and not sufficient. Nor does it model every Azure service: the Scope section above says which parts of Azure it covers, and which it leaves to you.

It isn't an offensive security guide. Paths here are computed from configuration, by defenders, with read-only access. Nothing in the book exploits anything.

It isn't about a product. Every technique uses public Azure and Microsoft Graph APIs [S5, S6] and code you can read. None of the chapters, Appendices A to C, or Appendix E depend on commercial tooling, describe its internals, or recommend it. If the optional case study in Appendix D is published, the tooling it used appears only in a clearly marked sidebar.

## Disclosure

I build commercial software that analyzes Azure identity and access paths. That work is why these problems are the ones I know, and it is a conflict of interest: a reader could assume the book is an argument for buying that software.

It isn't. The software is not named in the chapters or in Appendices A, B, C, or E. Nothing in those parts depends on it, describes how it works, or recommends it. Appendix D, if it is published, names the tooling only in a marked sidebar. A publisher's house style can retitle this section. Naming the product in the preface would be a separate decision, and this draft doesn't make it.

And it doesn't promise that models will get this right. The book's position is that they'll keep getting some of it wrong, and that the useful question is how to make those failures visible before a person relies on them.

---

## Sources

- **[S1]** List Azure deny assignments. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/deny-assignments> Checked 2026-10-12. Kind: documented.
- **[S2]** Microsoft Graph permissions reference. Microsoft Learn. <https://learn.microsoft.com/graph/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S3]** How to use structured outputs with Azure OpenAI in Microsoft Foundry Models. Microsoft Learn. <https://learn.microsoft.com/azure/ai-foundry/openai/how-to/structured-outputs> Checked 2026-10-12. Kind: documented.
- **[S4]** Naming rules and restrictions for Azure resources. Microsoft Learn. <https://learn.microsoft.com/azure/azure-resource-manager/management/resource-name-rules> Checked 2026-10-12. Kind: documented.
- **[S5]** Microsoft Graph overview. Microsoft Learn. <https://learn.microsoft.com/graph/overview> Checked 2026-10-12. Kind: documented.
- **[S6]** What is Azure Resource Manager?. Microsoft Learn. <https://learn.microsoft.com/azure/azure-resource-manager/management/overview> Checked 2026-10-12. Kind: documented.

---

## Author notes (remove before submission)

- 2026-10-12 (sources): added 4 sources. Changed: none. Softened: none. Unverified: none.
- 2026-10-12 (scope): added the Scope section with the coverage matrix and three path templates (PIM, Graph application permissions, Key Vault). Each status was checked against the chapters and appendices. Nothing is marked "planned": only an owner decision should add that status. The working subtitle in the README now names the scope (*… for Azure Identity, RBAC, and PaaS Data Access*), in its own commit so it can be reverted alone. Re-check the matrix whenever a chapter adds or drops a domain.
- 2026-10-12 (disclosure): the product stays unnamed. The IP boundary forbids a product pitch, and Appendix D is the only place tooling may be named, in a marked sidebar, and only if that appendix is published. The Disclosure section is the paragraph a publisher can restyle. Naming the product is still an owner decision; this draft does not make it.
- Add acknowledgments (technical reviewers, anyone who walked the lab) once the review round has happened.
- The reading paths name chapters by number. Re-check them if chapters are reordered.
- 2026-10-12 (BR-09): added Appendix E to the evaluator's path, added a fourth reading path for teams planning a pilot, and extended the no-dependency statement to Appendix E.
- Keep "What you'll be able to do" in step with the README thesis and the chapter summaries.
- When the lab moves to its own public repository, replace the in-repo paths with that repository's URL.
