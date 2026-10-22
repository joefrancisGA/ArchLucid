> **Scope:** Paste-ready GPT-5.6 Luna prompts. Collect Azure role names, translate the roles ArchLucid already understands, and say so in plain language on the diagram banner. Ask one question only when a managed identity on a resource in this snapshot holds an untranslated role on another resource in this snapshot. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/rbac-unmapped-role-00-index.md`](../../.cursor/prompts/rbac-unmapped-role-00-index.md), [`.cursor/prompts/rbac-unmapped-role-01-role-name.md`](../../.cursor/prompts/rbac-unmapped-role-01-role-name.md), [`.cursor/prompts/rbac-unmapped-role-02-warning-copy.md`](../../.cursor/prompts/rbac-unmapped-role-02-warning-copy.md), [`.cursor/prompts/rbac-unmapped-role-03-app-resource-question.md`](../../.cursor/prompts/rbac-unmapped-role-03-app-resource-question.md), [`.cursor/prompts/rbac-unmapped-role-hold.md`](../../.cursor/prompts/rbac-unmapped-role-hold.md)

# RBAC unmapped role — Luna prompts

**Created:** 2026-10-12 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Run them in order. Do not implement from this index.

`rbac-role-unmapped:{roleDefinitionId}` means a collected role assignment did not become a `CAN_READ` or `CAN_WRITE` edge. `AzureInventorySecurityEdgeMaterializer.AddRoleAssignmentEdges` still writes `HAS_ROLE`. The role map refuses any name it does not list. The Tier 1 package stores `roleDefinitionId` and not the display name. `AzureInventoryBuiltInRoleDefinitionNames` translates eight built-in ids. The banner prints the raw string as "Inventory completeness note".

That string is not evidence the role is unused, and it is not evidence the role can be removed. Removal belongs in a Microsoft Entra access review.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **RUR-01** | [rbac-unmapped-role-01-role-name.md](../../.cursor/prompts/rbac-unmapped-role-01-role-name.md) | — | Store the role display name and translate the built-in roles the data-plane map already understands. |
| **RUR-02** | [rbac-unmapped-role-02-warning-copy.md](../../.cursor/prompts/rbac-unmapped-role-02-warning-copy.md) | RUR-01 | One plain-language warning per role, with the assignment count. |
| **RUR-03** | [rbac-unmapped-role-03-app-resource-question.md](../../.cursor/prompts/rbac-unmapped-role-03-app-resource-question.md) | RUR-01 | Ask what one app does with one resource in this snapshot: read, write, or nothing. The answer draws or omits a HumanAssertion line. |
| **RUR-HOLD** | [rbac-unmapped-role-hold.md](../../.cursor/prompts/rbac-unmapped-role-hold.md) | — | Forbidden scope |

**RUR-02** can read a name only after **RUR-01** stores it. **RUR-03** reads that stored name. A package already collected still rematerializes the eight old ids plus any new id in the built-in dictionary. A custom role name appears only after a new Tier 1 collection.

## Do not pull into these sessions

- A question that asks whether a role can be deleted
- A call to Microsoft Entra access reviews, Activity Log, or diagnostic settings
- A question per role definition id, per user, or per group
- Fan-out of a subscription or resource-group assignment onto every child
- Hiding `rbac-role-unmapped`, `rbac-scope-too-broad`, or `app-settings-not-collected-hosted-get-only`
- Promoting HumanAssertion or DerivedFact to ObservedFact
- A new Azure HTTP call, or a `$scriptVersion` bump
- Re-running **SN-QQ**, **SN-RT-12**, **AX-DE**, or **DMW** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
