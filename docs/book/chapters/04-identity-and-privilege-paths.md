> **Scope:** Chapter 4 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 4 — Identity and privilege paths

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

In Azure, identity is the main perimeter. Privilege paths run through group nesting, inherited RBAC scopes, managed identities, and CI/CD federated credentials.

## Key points

- Model identities and resources as a graph; edges are memberships and role assignments.
- Inheritance: a role at management-group scope reaches every child resource.
- Managed identities turn compute compromise into data-plane access.
- Federated credentials (for example GitHub Actions OIDC) extend the path outside Azure.
- PIM eligible versus active assignments change what "has access" means.

## Lab idea

Build a small graph in Python or C# from exported role assignments and find every path from a CI pipeline identity to a Key Vault.

## Open questions

- How deep to go on Entra directory roles versus Azure RBAC?
