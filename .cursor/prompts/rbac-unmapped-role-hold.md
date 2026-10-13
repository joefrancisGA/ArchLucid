# RUR-HOLD — RBAC unmapped role stop list

**Model:** GPT-5.6 Luna. Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/RBAC_UNMAPPED_ROLE_LUNA_PROMPTS.md`

## Stop

Do not build any of the following while implementing RUR-01 through RUR-03:

- A question whose text asks whether a role, assignment, or principal can be removed, deleted, or left unused.
- A Microsoft Entra access review, Privileged Identity Management activation, Activity Log query, or diagnostic-setting read. Those tell an operator whether a grant is exercised. They are not this wave.
- One questionnaire item per role definition id, per user, or per group.
- A data-plane edge from a subscription, resource group, or management group onto every child resource.
- Hiding `rbac-role-unmapped`, or treating a missing warning as proof the role secures nothing.
- Storing an operator answer as `ObservedFact` or `AiInference`.
- An AI that drafts, selects, or submits Read, Write, or Nothing.
- A `$scriptVersion` bump, a role-definition GET, or a second customer package script.
- Re-running SN-QQ, SN-RT-12, AX-DE, or DMW as greenfield.

If the session is about to do one of these, stop and report which line it hit.
