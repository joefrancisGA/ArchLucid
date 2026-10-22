> **Scope:** Chapter-level outline for the book draft *Managing Azure Security with AI*. Author planning only; not product documentation.
> **Status:** draft

# Outline

**Spine:** [`README.md`](README.md)

## Front matter

- Preface: who the book is for, reading paths, the companion lab, conventions. First draft: [front-matter/preface.md](front-matter/preface.md).

## Part I — Foundations

1. **Why checklists fail.** Misconfiguration lists versus exploitable paths. Why "500 findings" does not tell a team what to fix first.
2. **Evidence and epistemics.** Five ways a claim can be known: observed fact, derived fact, deterministic inference, AI inference, human assertion. Why AI output must never be promoted to observed fact.
3. **Collecting Azure evidence read-only.** Azure Resource Graph, Microsoft Graph, RBAC exports, network configuration. Least-privilege collection, gaps as first-class results.

## Part II — Reasoning about paths

4. **Identity and privilege paths.** Entra users, groups, service principals, managed identities, federated credentials, Azure RBAC inheritance, PIM. Becoming another identity, granting more access, control-to-data conversions.
5. **Building the identity graph.** Typed, cited edges derived from assignments; unmodeled controls; paths across time; the access-decision contract; the payments graph and its lab.
6. **Network exposure.** Four kinds of reachability, PaaS public exposure, private endpoints, NSGs, routes, peering, firewalls, DNS.
7. **Computing and confirming reachability.** Configured reachability with three answers, network edges in the path graph, observed and intended reachability, the confirmation ladder, and the lab.
8. **Data flow: may access vs did access.** Capability is not exfiltration. Declared, probable, observed, and human-confirmed flows.

## Part III — AI in the loop

9. **Where LLMs help.** Explaining a cited path, triage summaries, drafting runbooks and Terraform, executive narratives. Grounding and citation patterns.
10. **Where LLMs hurt.** Hallucinated findings, false confidence numbers, prompt injection through resource tags and descriptions, over-automation.

## Part IV — Closing the loop

11. **Advisory remediation.** Cut points (fixes that break the most paths), Terraform representation, ITSM handoff, humans apply changes.
12. **Verification and outcome metrics.** Compare the next snapshot to claimed postconditions. Measure paths removed and crown-jewel exposure reduced, not findings closed.
13. **Governing the AI tooling itself.** Tenant isolation, least privilege for the AI service, data residency, privacy-preserving audit metadata and controlled prompt/output retention, cost control.

## Appendices (planned)

- A. Companion lab setup (sample tenant, Terraform, deliberately vulnerable paths). First draft: [appendices/a-companion-lab.md](appendices/a-companion-lab.md).
- B. Query cookbook (Resource Graph KQL, Microsoft Graph). First draft: [appendices/b-query-cookbook.md](appendices/b-query-cookbook.md).
- C. Prompt patterns for grounded security explanations. First draft: [appendices/c-prompt-patterns.md](appendices/c-prompt-patterns.md).
- D. Optional case study (owner-approved, sanitized). Scaffold: [appendices/d-case-study.md](appendices/d-case-study.md), with sanitization check `tools/check_case_study.py`.
- E. Adoption roadmap (pilot scope, collector approval package, 30/60/90-day plan, expansion and stopping criteria). First draft: [appendices/e-adoption-roadmap.md](appendices/e-adoption-roadmap.md).

## Back matter

- Glossary: every chapter's key terms plus acronyms. First draft: [back-matter/glossary.md](back-matter/glossary.md).
- Index: built from final page proofs.
