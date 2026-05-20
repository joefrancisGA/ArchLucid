# Implement a numbered improvement from LATEST.md

Ship one item from **`## Top Improvement Opportunities`** in [`docs/assessments/LATEST.md`](docs/assessments/LATEST.md), then mark it completed in that same file.

## Input (required)

The user provides **N** (integer **1–24**) in the message that invokes this command (for example: `/implement-latest-improvement 17` or `17` on the next line).

If **N** is missing or ambiguous, ask once: *Which Top Improvement Opportunities number (1–24)?* — then stop until they reply.

**Do not** treat **Weighted Quality Assessment** headings (`### 1.` … `### 20.`) as the ID unless the user explicitly says they mean a quality dimension, not the backlog list.

## Before coding

1. Read **`docs/assessments/LATEST.md`** and locate list item **`N.`** under **`## Top Improvement Opportunities`** only.
2. **Stop without implementing** if any of these apply:
   - Title or bullets already show **`*(Completed …)*`**, **`**Completed.**`**, or **`Status:** **Completed**`
   - **`Status: DEFERRED`** or title contains **`DEFERRED`**
   - No fenced **` ```text `** implementation block under that item
3. Treat the **` ```text `** block as the **sole functional spec** (scope, files, acceptance). Do not expand scope beyond it.
4. Skim **`docs/library/V1_SCOPE.md`** and **`docs/library/V1_DEFERRED.md`** only if the item might touch deferred or out-of-scope work; state uncertainty before coding.
5. For HTTP/OpenAPI/UI client changes, follow **`.cursor/skills/archlucid-api-surface-change/SKILL.md`**.

## Implementation

- Follow **`.cursor/rules/User-Task-Discipline.mdc`**, **`.cursor/rules/Agent-Execution-Policy.mdc`**, and **`.cursor/rules/Agent-Shell-Discipline.mdc`** (at most one shell per turn; prefer Read/Grep).
- Match surrounding code style; surgical edits only.
- After substantive C# or **`archlucid-ui/`** edits, run one scoped compile: **`.\scripts\ci\agent-compile-check.ps1 -ProjectPath <smallest-covering.csproj-or.slnf>`** (or **`-Ui`** for TS-only), per **`.cursor/rules/Agent-Local-Compile.mdc`**.

## Mark completed in LATEST.md (same PR / session)

Use **today’s date** in ISO form (`YYYY-MM-DD`) from the user’s environment.

Update **only** the matching **`N.`** entry under **`## Top Improvement Opportunities`**:

1. Append to the list title line: **` *(Completed YYYY-MM-DD)*`**
2. Add or extend a bullet: **`- **Completed.**`** — one to three sentences naming what shipped (types, endpoints, files).
3. Set **`- **Status:** **Completed** (YYYY-MM-DD).`** — replace **`Actionable now`** or prior status.
4. **Keep** the original **` ```text `** prompt block unchanged (historical spec).
5. **Do not** rewrite **`(A)`** headline score, dimension weights, or unrelated backlog items unless this task explicitly required it.

**Optional (only when obvious):** If the same work is mirrored under **`## Weighted Quality Assessment`** (**Improvement recommendations** / **Status** for that theme), add **`*(Completed YYYY-MM-DD.)*`** there and set **Status** to **Completed** — skip if the link is unclear.

**Do not** run a full assessment pass or overwrite **`LATEST.md`** outside this item unless the user asks.

## Finish

Reply with:

- **N** and the improvement title
- What was implemented (brief)
- Verification run (compile command or deferred reason)
- Confirmation that **`LATEST.md`** was updated

Do **not** commit or open a PR unless the user explicitly asks.
