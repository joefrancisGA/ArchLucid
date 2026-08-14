---
description: Hunt a real code defect with a failing repro, fix it with tests, and push to master
---

# Bug hunt, fix, ship (`/al-bug`)

End-to-end **proactive defect** loop: find a **real** bug (prove it with a failing test or repro), implement a **minimal** fix, run **scoped** verification, and **push to `master`**.

Distinct from **`/al-defect`** (production defect intake + `PD-###` log) and **`/ship-next-improvement`** (backlog-driven feature work).

**Default git target:** **`master`** (user may override by naming another branch in the same message).

One invocation runs three phases **without stopping for approval between them**:

| Phase | Goal |
|-------|------|
| **1 — Find** | Identify a genuine defect; prove with a failing test |
| **2 — Fix** | Minimal correct fix + permanent regression test |
| **3 — Ship** | Commit scoped paths and push to target branch |

---

## Arguments

```text
/al-bug
/al-bug master
/al-bug "<optional hunt hint>"
/al-bug master "<optional hunt hint>"
/al-bug --find-only
/al-bug master --find-only
```

- **`master`** (optional) — explicit branch target; default is **`master`** when omitted (satisfies `.cursor/rules/Git-Commit-Requires-Branch.mdc`).
- **`"<optional hunt hint>"`** — subsystem, file, symptom, or area to prioritize (e.g. `topology merge gate`, `ARM resource ids`).
- **`--find-only`** — stop after Phase 1 with the bug report and failing repro; no fix, commit, or push.

Examples:

```text
/al-bug
/al-bug master
/al-bug "topology proposal graph merge"
/al-bug master --find-only
```

---

## Guardrails (read first)

- Follow `.cursor/rules/Agent-Working-Tree-Safety.mdc` before editing tracked files.
- Follow `.cursor/rules/shell-hygiene.mdc` and `.cursor/rules/shell-heartbeat.mdc` (Medium tier for scoped tests).
- Stage **only** paths changed for this bug; never `git add -A` on a dirty tree.
- **Repro-first:** do not “fix” until a test or repro **fails on current code**.
- **Minimal diff:** fix the root cause; no drive-by refactors.
- **No full-solution builds** unless scoped compile/test cannot cover the defect.
- **Do not** run `/fix-ci` or full CI unless the user explicitly asks — scoped tests + one compile check are enough for this command.
- **Do not** log `PD-###` / `TB-###` unless the user also asked for defect/backlog intake.

---

## Phase 1 — Find a real defect

### 1.1 Pick a hunt zone

Walk this order until you find a **confirmed** bug (or exhaust the list):

1. **User hint** — if provided in the message, start there.
2. **Topology proposal orchestration** (high yield) — under `ArchLucid.Application/Runs/Orchestration/`:
   - `AgentTopologyProposalMergeGate`
   - `AgentTopologyProposalGraphMerge`
   - `TopologyProposalRelationshipEdgeMapper`
   - `TopologyProposalRelationshipEndpointIndex`
   - `AgentProposalStructuralPostProcessor`
   - `CrossAgentProposalConsistencyGate`
   - Tests: `ArchLucid.Application.Tests/Runs/Orchestration/*`
3. **Recent `master` commits** touching those paths — look for asymmetry between merge gate, graph merge, and edge mapper.
4. **Gap patterns** (common in this subsystem):
   - Merge gate keeps a relationship but graph merge drops the edge
   - Endpoint keyed by synthetic id (`svc-` / `ds-`), Terraform `SourceId`, ARM property, or renamed label not resolved
   - Inventoried vs agent-proposed node handling inconsistent
   - Category mismatch (`storage` vs `data`) for synthetic datastore keys

### 1.2 Prove it

1. Read the implicated code and existing tests.
2. Add a **focused unit test** (preferred) or a temporary repro test class that **fails on current `master`**.
3. Run scoped tests:

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj `
  --filter "FullyQualifiedName~<TestClassOrMethod>" 
```

Filter syntax: use `|` between patterns, not regex groups.

4. If you cannot make a test fail, **do not claim a bug** — pick another hypothesis.

### 1.3 Phase 1 output (always)

Report:

- **Bug title** (one line)
- **Symptom** — what callers/users lose
- **Root cause** — file + mechanism
- **Repro** — test name or minimal steps
- **Severity** — high / medium / low

If `--find-only`, **stop here**.

---

## Phase 2 — Fix

1. Working-tree safety on every path you will edit:

```powershell
.\scripts\agent\check-working-tree-path.ps1 -Path '<path1>','<path2>'
```

Exit code **2** → stop; tell the user which paths are blocked.

2. Implement the **smallest** fix that makes the repro pass.
3. Keep the regression test in the permanent test file (delete temporary repro-only files).
4. Run scoped tests again — all relevant tests must pass.
5. Optional **one** scoped compile check when .NET production code changed:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

---

## Phase 3 — Ship to `master`

Target branch is **`master`** unless the user named another branch in the same message.

### 3.1 Prefer the push helper (dirty main tree)

When the main working tree has unrelated dirty files, push via isolated worktree:

```powershell
.\scripts\agent\al-bug-push-master.ps1 `
  -Paths @(
    'ArchLucid.Application/Runs/Orchestration/SomeFile.cs',
    'ArchLucid.Application.Tests/Runs/Orchestration/SomeTests.cs'
  ) `
  -CommitMessage @'
One-sentence why focused on the defect.

'@
```

`-TargetBranch master` is the default. Use `-TargetBranch <name>` when the user overrode the branch.

Add `-DryRun` to preview without push.

### 3.2 Direct commit (clean tree only)

When the main tree is clean except for your bugfix files:

```powershell
git add <scoped-paths>
git commit -m "Fix <concise defect description>."
git push origin master
```

### 3.3 Verify

```powershell
git fetch origin master
git log origin/master -1 --oneline
```

---

## Phase 4 — Report back (always)

```markdown
## /al-bug result

| Field | Value |
| --- | --- |
| Branch | `master` (or override) |
| Bug | <one-line title> |
| Root cause | <short mechanism> |
| Fix | <what changed> |
| Tests | <test names> — N passed |
| Commit | `<sha>` on `origin/master` |
| Left unstaged | <paths or none> |
```

---

## Canonical files

- `.cursor/commands/al-bug.md` — this workflow
- `.cursor/skills/al-bug/SKILL.md` — skill pointer + hunt heuristics
- `scripts/agent/al-bug-push-master.ps1` — worktree commit/push helper

## Related commands

- `/al-defect` — production defect intake (`PD-###`) from operator reports
- `/ship-next-improvement` — ship the next backlog / assessment item
- `/check-compiler-errors` — optional deeper compile verification
