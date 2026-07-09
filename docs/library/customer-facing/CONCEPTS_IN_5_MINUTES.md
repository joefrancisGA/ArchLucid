> **Scope:** Customer-facing — one-page conceptual map for evaluators and pilot engineers. The in-app `/help/getting-started` guide is the primary onboarding surface; this file stays aligned for doc index and exports.

# ArchLucid concepts in five minutes

**Audience:** For architects, pilot teams, and sponsors who want to understand the review flow before starting.

## How ArchLucid works

ArchLucid ingests architecture evidence, evaluates it against your standards, and produces a governed review package you can share.

1. **Evidence** — briefs, diagrams, documents, IaC, optional cloud inventory  
2. **Analyze** — assessment engines evaluate the architecture in scope  
3. **Findings** — structured issues with severity and evidence links  
4. **Decisions** — approvals, accepted risks, and governance notes  
5. **Governance outputs** — signed decision record, evidence trail, and exports  

## Plain-language vocabulary

| Term | One-line meaning |
|------|------------------|
| **Review package** | The complete set of findings, decisions, evidence, and exports for one architecture review. |
| **Evidence** | Briefs, diagrams, documents, IaC exports, and optional cloud inventory. |
| **Findings** | Structured issues and risks surfaced during analysis. |
| **Decision record** | The signed outcome of the review. |
| **Evidence trail** | Traceable path from findings back to supporting artifacts. |
| **Policy pack** | Versioned governance standards and rules for your workspace. |
| **Governance approval** | Formal sign-off when a review requires approver acknowledgement. |

## What happens during a review?

1. **Add architecture evidence** — attach inputs to a new review package.  
2. **Analyze the architecture** — run the assessment and monitor progress.  
3. **Review findings** — triage issues and confirm evidence coverage.  
4. **Record decisions** — capture approvals and accepted risks.  
5. **Finalize and share outputs** — lock the package and export sponsor-ready artifacts.  

## Where to go next

| Need | In-app guide |
|------|----------------|
| Start a review | `/reviews/new` |
| Open a sample package | `/reviews/claims-intake-modernization` |
| First-review walkthrough | `/help/first-hour-operator-path` |
| Cloud evidence (optional) | `/integrations/cloud-connections` |
| Workspace scope | **[WORKSPACE_SCOPE_GUIDE.md](WORKSPACE_SCOPE_GUIDE.md)** |

## Technical details for administrators

Implementation mapping (APIs, storage identifiers, orchestration internals) lives in the in-app **Technical details for administrators** section on `/help/getting-started` and in engineering docs such as **[ARCHITECTURE_ON_ONE_PAGE.md](../../ARCHITECTURE_ON_ONE_PAGE.md)**.
