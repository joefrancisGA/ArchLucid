<!-- RBAC unmapped role — Luna prompts.
     Do not implement from this index. -->

# RBAC unmapped role — Luna prompt set (RUR-01–RUR-03)

**Do not implement from this index.** Paste **one** numbered file per Luna session. Run them in order.

Record: [`docs/architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`](../../docs/architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md).

| # | File | What it changes |
|---|------|-----------------|
| 01 | `rbac-unmapped-role-01-role-name.md` | Role display name on the package and the snapshot; built-in ids for roles the data-plane map already names |
| 02 | `rbac-unmapped-role-02-warning-copy.md` | One plain-language `rbac-role-unmapped` row per role, with the assignment count |
| 03 | `rbac-unmapped-role-03-app-resource-question.md` | Read, write, or nothing for one managed identity, one app, and one resource in this snapshot |
| Hold | `rbac-unmapped-role-hold.md` | Stop list. Not a feature |

**02** follows **01**. **03** follows **01**. Do not bump script `0.4.7`. Do not ask whether a role can be deleted.
