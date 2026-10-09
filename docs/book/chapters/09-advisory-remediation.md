> **Scope:** Chapter 9 stub for the book draft *Managing Azure Security with AI*. Author working notes; not product documentation.
> **Status:** draft

# Chapter 9 — Advisory remediation

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

## Reader takeaway

Find the **cut points**: the few changes that break the most paths. Recommend them; let humans and existing change processes apply them.

## Key points

- Cut-point thinking: one role removal can close dozens of paths.
- Express fixes as Terraform so they go through normal review and pipelines.
- ITSM handoff (ServiceNow, Jira, Azure DevOps) with the path as justification.
- Why the analysis tool should hold no write roles.

## Lab idea

Compute the minimal set of edge removals that disconnects all CI identities from the Key Vault in the Chapter 4 graph.

## Open questions

- Keep the cut-point algorithm intuitive (greedy) rather than formal min-cut?
