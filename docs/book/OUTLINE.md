> **Scope:** Chapter-level outline for the book draft *Managing Azure Security with AI*. Author planning only; not product documentation.
> **Status:** draft

# Outline

**Spine:** [`README.md`](README.md)

## Part I — Foundations

1. **Why checklists fail.** Misconfiguration lists versus exploitable paths. Why "500 findings" does not tell a team what to fix first.
2. **Evidence and epistemics.** Five ways a claim can be known: observed fact, derived fact, deterministic inference, AI inference, human assertion. Why AI output must never be promoted to observed fact.
3. **Collecting Azure evidence read-only.** Azure Resource Graph, Microsoft Graph, RBAC exports, network configuration. Least-privilege collection, gaps as first-class results.

## Part II — Reasoning about paths

4. **Identity and privilege paths.** Entra users, groups, service principals, managed identities, federated credentials, Azure RBAC inheritance, PIM.
5. **Network reachability.** Public exposure, private endpoints, NSGs, firewalls, peering. Intended versus actual reachability.
6. **Data flow: may access vs did access.** Capability is not exfiltration. Declared, probable, observed, and human-confirmed flows.

## Part III — AI in the loop

7. **Where LLMs help.** Explaining a cited path, triage summaries, drafting runbooks and Terraform, executive narratives. Grounding and citation patterns.
8. **Where LLMs hurt.** Hallucinated findings, false confidence numbers, prompt injection through resource tags and descriptions, over-automation.

## Part IV — Closing the loop

9. **Advisory remediation.** Cut points (fixes that break the most paths), Terraform representation, ITSM handoff, humans apply changes.
10. **Verification and outcome metrics.** Compare the next snapshot to claimed postconditions. Measure paths removed and crown-jewel exposure reduced, not findings closed.
11. **Governing the AI tooling itself.** Tenant isolation, least privilege for the AI service, data residency, privacy-preserving audit metadata and controlled prompt/output retention, cost control.

## Appendices (planned)

- A. Companion lab setup (sample tenant, Terraform, deliberately vulnerable paths). First draft: [appendices/a-companion-lab.md](appendices/a-companion-lab.md).
- B. Query cookbook (Resource Graph KQL, Microsoft Graph). First draft: [appendices/b-query-cookbook.md](appendices/b-query-cookbook.md).
- C. Prompt patterns for grounded security explanations. First draft: [appendices/c-prompt-patterns.md](appendices/c-prompt-patterns.md).
- D. Optional case study (owner-approved, sanitized).
