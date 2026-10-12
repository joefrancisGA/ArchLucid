> **Scope:** Chapter 4 revised draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft — revised (revision pass 1, 2026-10-10; split 2026-10-12)

# Chapter 4 — Identity and privilege paths

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: revised (revision pass 1, 2026-10-10; split 2026-10-12). Target 4,500 words. Facts about Azure and Entra ID behavior were checked against Microsoft documentation in October 2026; dated "As of" notes mark the ones to re-check before submission.*

**Builds on:** Chapter 2 (evidence categories and Rule 1, sections 2.2 and 2.4), Chapter 3 (the snapshot, its read times, and its gaps, sections 3.5 and 3.7).

---

## The fix that didn't close the path

In this fictional scenario, Contoso's payments team acted on the path from Chapter 1. They changed the federated credential on `payments-deploy` so that it trusted only the `production` GitHub environment, which requires approval from a designated reviewer before a deployment job can run. Merging to `main` was no longer enough to sign in as the deployment identity. They closed the ticket.

Two weeks later, a review of the identity graph found three more ways to reach the same storage account. None of them involved GitHub at all:

1. A senior developer was listed as an **owner** of the `payments-deploy` app registration [S1]. Owners can add credentials to the app [S2, S1]. Any credential, including a client secret they choose, lets them sign in as `payments-deploy` and inherit its Contributor role [S2].
2. Someone on the help desk held the Entra directory role **Cloud Application Administrator** [S3]. That role can add credentials to *any* app registration in the tenant, `payments-deploy` included [S3].
3. A Function App in `rg-payments-prod` ran with a user-assigned managed identity that held **Storage Blob Data Reader** on a second account, `custarchive`, which held seven years of archived customer records [S4, S5]. Contributor on the resource group means you can deploy code to that Function App, and code running in the Function App can use its managed identity [S5, S6].

The original fix was correct. It closed one entry point. But the deployment identity itself was the valuable thing, and there were several ways to become it. The team had fixed a *path*, and the *identity* was still exposed.

This chapter is about identity hops: the relationships that let one principal become, control, or act as another. In Azure they're the backbone of most serious paths, and they're the hops a list of role assignments is least able to show.

---

## 4.1 Why identity is the perimeter

In a traditional data center, network position decided a lot: if you were on the right VLAN, you could reach the database. In Azure, most control-plane and many data-plane operations go through Azure Resource Manager or service endpoints that anyone on the internet can reach, given a valid token [S7]. What decides whether a request succeeds is **who** the token says you are and what that identity is allowed to do [S8].

That makes identity hops the most common, and usually the shortest, links in an Azure path. Network controls (Chapters 6 and 7) still matter a great deal, especially for data planes. But when you trace a real path from an entry point to something valuable, most of the hops are identity hops:

- *is a member of* a group,
- *holds a role at* a scope,
- *can sign in as* another identity,
- *can grant itself or others* more access,
- *controls a resource that runs as* an identity.

The sections below take these one at a time. Chapter 5 combines them into a graph you can search, and its lab builds that graph for the payments estate.

---

## 4.2 Effective access: from assignments to "can"

Section 3.3 collected role assignments: principal, role, scope. Turning those into "what can this identity actually do, where" is a derivation with several rules. Get any of them wrong and you'll either miss paths or invent them.

### Rule 1: Scopes inherit downward

Azure role assignments apply at the scope where they're made **and every scope below it** [S9]:

```text
tenant root management group
  └── management group
        └── subscription
              └── resource group
                    └── resource
```

Contributor at a subscription is Contributor on every resource group and resource in it [S9]. Reader at the root management group is Reader everywhere [S9]. This is why a handful of high-scope assignments often dominate an estate's identity graph. One assignment at the root can matter more than a thousand at resource scope [S9].

### Rule 2: Groups expand transitively

An assignment to a group applies to every member, including members of nested groups [S10, S11]. Collect transitive membership for exactly this reason: Section 3.4 explains why direct members are not enough, and the section 5.8 lab writes the file. Effective access for a user is the union of their direct assignments and those of every group they're in, at any depth [S11].

### Rule 3: Roles are sets of actions, in two planes

A role definition lists **Actions** (control plane: managing the resource) and **DataActions** (data plane: reading and writing what's inside it), with corresponding NotActions and NotDataActions that subtract from them [S6].

This distinction is the key to many paths:

- **Contributor** has broad Actions (`*`), minus authorization writes and a few others, and **no DataActions** [S6]. A Contributor can't read blobs using their own Entra identity [S6].
- **Storage Blob Data Reader** has a narrow DataAction to read blobs, and almost no Actions [S4].
- But the Actions of Contributor include `Microsoft.Storage/storageAccounts/listKeys/action` [S6, S12]. The storage account key bypasses Entra identity entirely and grants full data access, if shared key access is enabled [S12].

So "Contributor can't read data" is true in the data-plane sense and false in practice, wherever a control-plane action produces a credential for the data plane. That conversion, from control-plane permission to data-plane access, is one of the most important hop types in Azure. Section 4.5 lists common examples.

### Rule 4: Subtract what's denied or conditioned

Two mechanisms can reduce effective access:

- **Deny assignments** block specific actions for specific principals at a scope, and override role assignments [S13]. You generally can't create them directly; Azure creates them for certain features, such as managed applications and deployment stacks with deny settings [S13].
- **Conditions** on role assignments restrict when the role applies [S14]. The common case is storage data access limited by attributes such as container name or blob tags [S14]. Another important case is constraining which roles a delegated administrator can assign [S14].

Most estates have few of either. But a derivation that ignores them will report paths that don't exist, and a reviewer who finds one such false path will stop trusting the rest. Check them, and record that you checked (Chapter 2, hop 6).

The opposite mistake is quieter. A condition is an expression over attributes, such as container names, blob tags, or request properties, and a snapshot of role assignments usually can't evaluate it. A derivation that drops every conditioned assignment it can't evaluate doesn't report a false path. It hides one that might be real, and nobody notices the gap. Section 5.3 keeps those hops and labels them instead.

### Rule 5: Eligible is not active

With Privileged Identity Management (PIM), an assignment can be **eligible** rather than active: the principal can activate it, usually for a few hours, often after MFA, a justification, or an approval [S15]. An eligible assignment is a real hop, but a conditional one [S15].

Represent eligible assignments as a distinct edge type, "can activate", carrying the activation requirements. A path through an eligible Owner assignment that requires approval from a separate team is meaningfully harder to use than one through an active assignment. It's still a path, and it belongs in the graph.

The two kinds of eligibility live in different places. Eligibility for Azure resource roles is an ARM resource, `Microsoft.Authorization/roleEligibilitySchedules`, readable at the scope it applies to [S16]. Eligibility for Entra directory roles is in Microsoft Graph, under `roleManagement/directory/roleEligibilitySchedules`, and reading it needs a Graph permission such as `RoleEligibilitySchedule.Read.Directory` [S17]. A collector that reads only one of them will miss half the "can activate" edges [S16, S17].

### Effective access is a derived fact

Every rule above is deterministic and well-defined, which makes effective access a **derived fact** (section 2.2), as long as each rule is implemented correctly and the inputs are complete. Keep the inputs (which assignments, which memberships, which role definition) attached to every derived permission, so anyone can retrace it.

---

## 4.3 Becoming another identity

Effective access tells you what an identity can do. The more dangerous question is: **who can become this identity?** If many people can become `payments-deploy`, then `payments-deploy`'s permissions are effectively theirs.

Here are the common ways to become, or act as, a non-human identity in Azure and Entra ID.

### Federated identity credentials

A federated identity credential tells Entra ID to accept tokens from an external issuer, such as GitHub Actions, Azure DevOps, Kubernetes, or another cloud, for a specific **subject** [S18]. Anyone who can produce a token with that issuer and subject can sign in as the application [S18, S19].

The subject decides how wide the door is. For GitHub Actions, typical subjects look like this:

| Subject pattern | Who can produce the token |
|-----------------|---------------------------|
| `repo:contoso/payments:ref:refs/heads/main` | Any workflow run on `main`, so anyone who can get code merged there [S20] |
| `repo:contoso/payments:environment:production` | Workflows that target the `production` environment, subject to that environment's protection rules [S20] |
| `repo:contoso/payments:pull_request` | Workflows triggered by pull requests, so potentially anyone who can open one, depending on repository settings [S20] |
| `repo:contoso/payments:ref:refs/tags/*` pattern via flexible matching | Anyone who can push a matching tag [S20, S21] |

Reading a subject is only half the job. The other half is outside Azure: who can merge to `main`, what the environment's protection rules require, whether pull requests from forks can request tokens. That evidence lives in GitHub, not Entra. You can collect it from GitHub's API, or record it as a human assertion with an owner and date. Either way, label it. Don't assume.

By default, workflows triggered by pull requests from forks don't receive an OIDC token, so the `pull_request` row is usually limited to branches in the repository itself [S22]. Check whether anyone has changed that default [S22]. Entra's flexible federated credentials, still in preview, match subjects with a `claimsMatchingExpression` instead of an exact string [S21]. Read the expression the way you'd read a firewall rule: work out the widest set of subjects it accepts [S21].

> **As of 2026-10:** GitHub subject formats change [S20, S23]. Repositories created after July 15, 2026, repositories renamed or transferred after that date, and existing repositories that opt in use immutable subjects containing owner and repository IDs (`repo:owner@id/repo@id:…`), so a federated credential written for the old format won't match them [S20, S23]. Re-check the formats and the flexible credential syntax before you rely on them [S21].

### Owners and credential management

App registrations and service principals have **owners** [S1]. An owner can manage the app's credentials, including adding a new client secret or certificate [S2, S1]. A new credential lets the holder sign in as the app from anywhere [S2].

That makes app ownership one of the most overlooked privilege hops. Owners are often added for convenience, such as the developer who created the app or the team lead who asked for it, and never removed. In the opening story, a developer's ownership of `payments-deploy` was a direct path to production Contributor.

Several Entra directory roles grant the same capability across many apps:

- **Application Administrator** and **Cloud Application Administrator** can manage credentials on application registrations and enterprise applications across the tenant [S3].
- **Global Administrator** can do this and much more [S3].
- **Privileged Role Administrator** doesn't manage credentials directly, but it can assign itself any directory role, including the ones above [S3]. That's a granting hop (section 4.4), not a "become" hop [S3].

Microsoft's own role documentation warns about the consequence: a holder of Application Administrator can add a credential to an app and then do anything that app's identity can do [S3]. The role doesn't exclude apps that hold privileged permissions, so treat these roles as able to become every application in their scope [S3].

### Managed identities and control of compute

A managed identity is an identity Azure attaches to a resource [S5]. Code running on that resource can obtain tokens for it from a local endpoint, with no credential to steal [S5, S24]. That's excellent for removing secrets. It also means: **whoever controls the code running on the resource can act as its managed identity.** [S5]

Ways to control the code include:

- deploying a new version of a Function App, App Service, or container app,
- running a command on a virtual machine (VM run command, extensions),
- editing an Automation account runbook,
- changing a Logic App's workflow definition.

Many of these are ordinary control-plane actions included in Contributor and in service-specific contributor roles [S6]. So "Contributor on a resource group" often implies "can act as every managed identity attached to resources in that group" [S6, S5].

There's one more twist for **user-assigned** managed identities. A user-assigned identity is a standalone resource that can be attached to many compute resources. Attaching one requires permission to assign the identity as well as write access to the compute resource [S4]. An identity that holds Contributor in a resource group containing both a VM and a user-assigned identity can usually attach the identity to the VM and then use it [S6, S4].

The opening story's third path was exactly this: Contributor on `rg-payments-prod`, deploy code to the Function App, act as its managed identity, and read `custarchive` with a data-plane role.

### Summary of "become" hops

| Hop | Requires | Evidence source |
|-----|----------|-----------------|
| Federated credential | Producing a token with the trusted issuer and subject | Graph (credential) + external system (who can produce it) |
| Add credential as owner | Ownership of the app or service principal | Graph (owners) |
| Add credential via directory role | Application Administrator, Cloud Application Administrator, or Global Administrator [S3] | Graph (directory role assignments) |
| Act as a managed identity | Control of code running on the attached resource | ARG (identity attachments) + effective access to the resource |
| Attach a user-assigned identity | Assign permission on the identity + write on the compute resource | ARG + effective access |

---

## 4.4 Granting more access

The third category of identity hop is **granting**: an identity that can change who holds what.

### Azure role assignment writers

Any identity with `Microsoft.Authorization/roleAssignments/write` at a scope can assign roles at that scope, including to itself [S6]. Built-in roles with this action include **Owner**, **User Access Administrator**, and **Role Based Access Control Administrator** [S4]. Contributor explicitly excludes it, which is why Contributor isn't automatically Owner [S6].

Treat "can write role assignments at scope S" as "can obtain any role at scope S". In graph terms, that's an edge from the identity to every role at that scope. In practice, it's simplest to treat such identities as equivalent to Owner at that scope, unless a condition restricts which roles they can assign.

### Elevating from the directory to Azure

A **Global Administrator** in Entra ID can turn on a setting that grants them User Access Administrator at the root scope of Azure [S25]. That's one click from directory administrator to the ability to grant themselves anything in every subscription [S25]. Your identity graph needs an edge from Global Administrator to root-scope User Access Administrator, labeled as requiring that elevation step [S25].

### Microsoft Graph application permissions as privilege

Service principals can hold Microsoft Graph **application permissions**, granted via admin consent [S26]. Some of these are effectively directory administration:

- permission to assign directory roles (`RoleManagement.ReadWrite.Directory`) [S26],
- permission to grant app role assignments, including Graph permissions, to any service principal, itself included (`AppRoleAssignment.ReadWrite.All`) [S26],
- permission to manage all applications' credentials (`Application.ReadWrite.All`) [S26].

A service principal holding one of these is a privileged identity, even if it has no Azure roles at all. It belongs in the graph with "can grant" edges, and so does everyone who can become it (section 4.3).

---

## 4.5 Control plane to data plane

Section 4.2 introduced the most important conversion in Azure paths: a control-plane permission that yields data-plane access. These are worth listing explicitly, because they're where "Contributor can't read data" turns out to be false.

| Control-plane capability | Data-plane result | Condition |
|--------------------------|-------------------|-----------|
| List storage account keys | Full access to blobs, files, queues, tables [S12] | Shared key access enabled [S12] |
| Generate an account SAS (requires keys) | Scoped data access, often long-lived [S12] | Shared key access enabled [S12] |
| Modify a key vault's access policies | Grant yourself secret, key, or certificate access [S27] | Vault uses the access-policy permission model rather than Azure RBAC [S27] |
| Deploy code to compute with a managed identity | Whatever the managed identity can access [S5] | Identity attached [S5] |
| Read a resource's connection strings or app settings (list action) | Credentials for other systems | Secrets stored in settings rather than Key Vault references |
| Change a database server's Entra administrator | Administrative access to the database | Entra authentication enabled |
| Reset a VM's local administrator password | Interactive access to the VM and its managed identity | VM access extension available |

Each row becomes a `grants` edge in the graph with its condition attached. Most are deterministic inferences: the conversion is real if the condition holds, and the condition is usually something your snapshot can check.

The first and third rows of that table explain why Microsoft has spent years pushing customers toward Azure RBAC for Key Vault and toward disabling shared key access on storage [S27, S28]. Both changes remove control-to-data conversions, so a control-plane role stays a control-plane role [S27, S28].

---

## 4.6 Directory roles and Azure roles are different systems

Entra ID **directory roles** (Global Administrator, Application Administrator, User Administrator, and so on) and Azure **resource roles** (Owner, Contributor, Reader, and so on) are separate authorization systems:

- Directory roles govern Entra objects: users, groups, applications, policies [S3].
- Azure roles govern Azure resources through Azure Resource Manager [S8].
- A Global Administrator has no Azure resource access by default, and a subscription Owner has no directory privileges by default [S25].

They connect through a few specific bridges, and your graph needs each one:

- **Elevation:** Global Administrator can grant themselves User Access Administrator at the Azure root (section 4.4) [S25].
- **Credential management:** directory roles that can add credentials to applications can become any service principal that holds Azure roles (section 4.3) [S3].
- **Group management:** directory roles or group owners that can change membership of a group used in Azure role assignments can add themselves to it. Watch especially for groups that aren't role-assignable, which don't get the extra protections role-assignable groups have [S29].
- **User management:** roles that can reset passwords or authentication methods for other users can take over those users, and everything they hold [S3].

The last two bridges mean the graph needs edges like "can modify membership of" and "can reset credentials of". Those come from directory role assignments and group ownership. Chapter 3's collector is allowed to read them (`RoleManagement.Read.Directory`, `GroupMember.Read.All`). The queries that write the files are in the section 5.8 lab.

---

## 4.7 Where AI fits

Identity paths are where AI explanation shines and AI reasoning fails most visibly.

**Explanation works well.** A ten-hop identity path written as a hop table is hard for most readers to follow. A model given that table, with citations, can produce something like:

> A developer who owns the `payments-deploy` app registration can add a password to it [hop 2]. That password lets them sign in as the payments deployment identity [hop 3], which can manage everything in the production payments resource group [hop 4]. That includes deploying code to the reconciliation Function App [hop 6], which runs as an identity that can read the customer archive [hops 7–8].

That's genuinely useful, if it stays grounded (section 9.2).

**Reasoning about roles fails.** Ask a model "can Contributor read blob data?" and you'll often get a confident answer that's either too simple ("no") or wrong in the details. Ask it what a custom role named `Payments Operator` can do, and it will guess from the name. Models don't know your custom roles, and their knowledge of built-in roles is frozen at their training date, while role definitions change.

So: **never let a model decide what a role permits.** Look it up in the role definitions you collected (section 3.3), compute effective actions deterministically, and give the model the result to explain.

**Graph search fails.** Ask a model to "find all the ways to reach `custdata`" from a large dump of role assignments and memberships, and it will find some, miss others, and occasionally invent an edge, such as a membership that doesn't exist or a role at the wrong scope. Graph search is exactly the exhaustive, repeatable work that deterministic code does well and models don't.

---

## 4.8 Lab: name the hops before you search

This lab doesn't build the graph. Section 5.8 does that. Here you classify the payments estate by hand, with the rules in this chapter, so you can tell later whether Chapter 5's code found what you already see.

**Setup.** Use this chapter's opening story and the companion lab's baseline (Appendix A): `dev-lead` owns `payments-deploy`, `helpdesk-07` holds Cloud Application Administrator, `payments-deploy` holds Contributor on `rg-payments-prod`, shared key access is enabled on `custdata`, and `pay-reconcile` runs as a managed identity that holds Storage Blob Data Reader on `custarchive`. Steps 1 to 4 need no deployment. Step 5 needs a Chapter 3 snapshot, if you have one.

**Step 1 — Label the three ways.** For each of the three ways the review found after the GitHub fix, name the hop type from section 4.1: member, role, become, grant, or control. Say which entry point the original fix actually closed.

**Step 2 — Apply the five rules to one assignment.** Take Contributor on `rg-payments-prod` and write one sentence for each rule in section 4.2. Include what the role does not grant.

**Step 3 — Mark the conversions.** Copy the table in section 4.5. Mark each row as applies on this estate, does not apply, or applies only if a condition you have not checked is true. Name the condition.

**Step 4 — Separate the two role systems.** For `helpdesk-07` and for `payments-deploy`, say which authorization system the principal sits in. Name the bridge from section 4.6 that connects them, and the bridge that doesn't.

**Step 5 — Optional, from a snapshot.** From `role-assignments.json`, pick one assignment that is not on a payments path. Say which of the five rules that file is enough to evaluate, and which ones need the files Step 0 of the section 5.8 lab collects.

**What you should see.**

- The three ways are all become or control hops, not grant hops. `dev-lead` can add a credential because of ownership (section 4.3). `helpdesk-07` can add a credential because of a directory role (section 4.3). Contributor can deploy code to `pay-reconcile`, and that code runs as the managed identity (section 4.3). The GitHub change closed one `canSignInAs` entry point. It did not close these three.
- Rule 1: the assignment covers every resource in `rg-payments-prod`. Rule 2: nothing in the story puts this assignment on a group. Rule 3: the role's control-plane actions include listing storage keys and writing the Function App, and its NotActions exclude `roleAssignments/write`, so Contributor is not Owner (section 4.4). The data-plane read of blobs is not one of those actions. Rule 4: the baseline has no deny and no condition on this assignment. Rule 5: the assignment is active, not eligible.
- Two conversions apply. Listing keys applies because shared key access is enabled. Deploying code applies because the managed identity is attached. The key vault row, the SQL Entra-admin row, and the VM password row do not apply: those resources are not on this path. Generating a SAS applies only after someone has already listed the keys.
- `helpdesk-07` holds a directory role and no Azure role. `payments-deploy` holds an Azure role and no directory role. The bridge in use is credential management (section 4.6). Elevation is not: nobody in the story is a Global Administrator.

None of this is a path search. If your labels disagree with the list above, stop and re-read the section they came from before you trust the graph in Chapter 5.

---

## Sources

- **[S1]** List owners of an application. Microsoft Learn. <https://learn.microsoft.com/graph/api/application-list-owners> Checked 2026-10-12. Kind: documented.
- **[S2]** Add and manage app credentials in Microsoft Entra ID. Microsoft Learn. <https://learn.microsoft.com/entra/identity-platform/how-to-add-credentials> Checked 2026-10-12. Kind: documented.
- **[S3]** Microsoft Entra built-in roles - permissions reference. Microsoft Learn. <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S4]** Azure built-in roles. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles> Checked 2026-10-12. Kind: documented.
- **[S5]** Managed identities for Azure resources overview. Microsoft Learn. <https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview> Checked 2026-10-12. Kind: documented.
- **[S6]** Understand Azure role definitions. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/role-definitions> Checked 2026-10-12. Kind: documented.
- **[S7]** Control plane and data plane operations. Microsoft Learn. <https://learn.microsoft.com/azure/azure-resource-manager/management/control-plane-and-data-plane> Checked 2026-10-12. Kind: documented.
- **[S8]** What is Azure role-based access control (Azure RBAC)? Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/overview> Checked 2026-10-12. Kind: documented.
- **[S9]** Understand scope for Azure RBAC. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/scope-overview> Checked 2026-10-12. Kind: documented.
- **[S10]** Understand Azure role assignments. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/role-assignments> Checked 2026-10-12. Kind: documented.
- **[S11]** List transitive members of a group. Microsoft Learn. <https://learn.microsoft.com/graph/api/group-list-transitivemembers> Checked 2026-10-12. Kind: documented.
- **[S12]** Manage storage account access keys. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/storage-account-keys-manage> Checked 2026-10-12. Kind: documented.
- **[S13]** List Azure deny assignments. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/deny-assignments> Checked 2026-10-12. Kind: documented.
- **[S14]** What is Azure attribute-based access control (Azure ABAC)? Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/conditions-overview> Checked 2026-10-12. Kind: documented.
- **[S15]** Assign Azure resource roles in Privileged Identity Management. Microsoft Learn. <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-resource-roles-assign-roles> Checked 2026-10-12. Kind: documented.
- **[S16]** Role Eligibility Schedules - List For Scope. Microsoft Learn. <https://learn.microsoft.com/rest/api/authorization/role-eligibility-schedules/list-for-scope> Checked 2026-10-12. Version: 2020-10-01. Kind: documented.
- **[S17]** List roleEligibilitySchedules. Microsoft Learn. <https://learn.microsoft.com/graph/api/rbacapplication-list-roleeligibilityschedules> Checked 2026-10-12. Kind: documented.
- **[S18]** Workload identity federation. Microsoft Learn. <https://learn.microsoft.com/entra/workload-id/workload-identity-federation> Checked 2026-10-12. Kind: documented.
- **[S19]** Create a trust relationship between an app and an external identity provider. Microsoft Learn. <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> Checked 2026-10-12. Kind: documented.
- **[S20]** OpenID Connect reference. GitHub Docs. <https://docs.github.com/en/actions/reference/openid-connect-reference> Checked 2026-10-12. Kind: documented.
- **[S21]** Set up a Flexible Federated identity credential (preview). Microsoft Learn. <https://learn.microsoft.com/entra/workload-id/workload-identities-set-up-flexible-federated-identity-credential> Checked 2026-10-12. Kind: documented.
- **[S22]** Workflow syntax for GitHub Actions. GitHub Docs. <https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions> Checked 2026-10-12. Kind: documented.
- **[S23]** Configuring OpenID Connect in Azure. GitHub Docs. <https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-azure> Checked 2026-10-12. Kind: documented.
- **[S24]** Instance Metadata Service for Azure virtual machines. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-machines/windows/instance-metadata-service> Checked 2026-10-12. Kind: documented.
- **[S25]** Elevate access to manage all Azure subscriptions and management groups. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/elevate-access-global-admin> Checked 2026-10-12. Kind: documented.
- **[S26]** Microsoft Graph permissions reference. Microsoft Learn. <https://learn.microsoft.com/graph/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S27]** Migrate Key Vault to Azure role-based access control. Microsoft Learn. <https://learn.microsoft.com/azure/key-vault/general/rbac-migration> Checked 2026-10-12. Kind: documented.
- **[S28]** Prevent shared key authorization for Azure Storage. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/shared-key-authorization-prevent> Checked 2026-10-12. Kind: documented.
- **[S29]** Create a role-assignable group in Microsoft Entra ID. Microsoft Learn. <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-create-eligible> Checked 2026-10-12. Kind: documented.

---

## Summary

- In Azure, **identity is the perimeter**. Most serious paths are chains of identity hops: membership, role, become, grant, control.
- Effective access is a **derived fact** built from five rules: scopes inherit downward [S9], groups expand transitively [S11], roles have **control-plane and data-plane** actions [S6], deny assignments and conditions subtract [S13, S14], and **eligible is not active** [S15].
- The most dangerous question is **who can become an identity**: federated credential subjects, app **owners**, directory roles that manage credentials, and **control of code** running with a managed identity.
- Identities that can **write role assignments** [S4, S6], Global Administrators who can **elevate** [S25], and service principals with privileged **Graph application permissions** [S26] can grant themselves more.
- **Control-to-data conversions** (list keys, access policies, code deployment, credential reads) are why "Contributor can't read data" is often false [S12, S27, S5].
- Directory roles and Azure roles are **separate systems** connected by specific bridges [S25]. Model each bridge.
- Use AI to **explain** identity paths. Never let it decide what a role permits or search the graph for you.

## Key terms

- **Effective access** — what an identity can do at a scope after inheritance, group expansion, role contents, denies, and conditions.
- **Control plane / data plane** — managing a resource versus reading or writing what's inside it.
- **Control-to-data conversion** — a control-plane action that yields data-plane access (for example, listing storage keys).
- **Federated identity credential** — trust in an external issuer's tokens for a specific subject.
- **Subject** — the claim in an external token that identifies what is trusted (repository, branch, environment).
- **Owner (application)** — a principal that can manage an app registration's credentials.
- **Managed identity** — an identity attached to an Azure resource; code on that resource can use it.
- **Eligible assignment** — a PIM role that must be activated before use.

---

## Author notes (remove before submission)

- 2026-10-12 (chapter split): this chapter keeps the concepts of the old Chapter 4. The graph, its code, the access-decision contract, and the search lab moved to Chapter 5.
- 2026-10-12 (labs): added section 4.8, a classification exercise on the payments baseline. It changes no tenant state. The expected labels are taken from sections 4.2 to 4.6, not from a live run.
- 2026-10-12 (BR-10, repetition edit): recap and signpost references to other chapters were cut or turned into section pointers, and the **Builds on** line now carries the dependencies. No technical content, code, labs, or evidence categories changed. `tools/check_cross_refs.py` checks every reference.
- Verified 2026-10-10 (revision pass 1): Contributor NotActions [S6]; roles with `roleAssignments/write` [S4, S6]; PIM eligibility APIs and read permission [S12-S14]; Application Administrator and Cloud Application Administrator credential scope [S3]; Privileged Role Administrator removed from `canAddCredential` because it escalates by assignment [S3]; Global Administrator elevation [S25]; Graph self-escalation permission names [S26]; GitHub fork token default and immutable subjects [S20, S22, S23]; flexible credential syntax [S21]; section 4.5 conversions [S12, S27].
- Verify: managed identity attach permissions (assign action on user-assigned identity) and which built-in roles include code deployment for Functions, App Service, Automation, and Logic Apps. The lab uses `Microsoft.Web/sites/write` as the representative Function App action; confirm whether publish uses that action, `Microsoft.Web/sites/publish/action`, or both.
- Add the Chapter 4 fact checks to GTM **M-306** when it is picked up.
