> **Scope:** Contributor-reference — ArchLucid C# House Style - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid C# House Style

> **Source of truth:** the `.mdc` rule files under `.cursor/rules/`. This document is a **human-readable index** that consolidates them so a new contributor (or AI agent) can read one page and understand the project's day-to-day C# style. When this doc and a rule file disagree, **the rule file wins** — open a PR to fix this doc.

---

## Why this exists

ArchLucid is a large, multi-project .NET 10 solution where most code is read more often than it is written. The conventions below are tuned to:

1. **Keep the happy path flat** — guards, returns, and continues stay at the top of a member; the "real" logic lives unindented at the bottom.
2. **Stay terse without sacrificing safety** — concrete types, explicit nulls, no `var`, no silent fallbacks.
3. **Be enforceable** — every rule is a Cursor rule and (where possible) backed by EditorConfig / `dotnet format` / a small Roslyn fixer in `scripts/`.

Read [`docs/library/FORMATTING.md`](FORMATTING.md) for the **mechanical** side (`dotnet format`, brace removal tool, simple-property collapser).

---

## How to apply this style

| What | Tool |
|------|------|
| Whitespace, brace placement, `using` ordering | `dotnet format ArchLucid.sln` |
| Remove `{ }` from single-statement `if` / `for` / `foreach` etc. | `dotnet run --project scripts/RemoveEmbeddedStatementBraces/RemoveEmbeddedStatementBraces.csproj -c Release -- .` |
| Collapse multi-line simple auto-properties | `python scripts/collapse_simple_properties.py` |
| Everything semantic in this doc | Cursor rules (auto-applied to `*.cs`) |

---

## Rule index — file-scoped for `**/*.cs`

These rules load when `*.cs` files are in context (`globs: "**/*.cs"`, `alwaysApply: false`). **Authoritative text** is the `.mdc` file; this section is an index only.

| Bundle | File | What it covers |
|--------|------|----------------|
| **Guards & flow** | [`CSharp-Terse-Guards-And-Flow.mdc`](../../.cursor/rules/CSharp-Terse-Guards-And-Flow.mdc) | Same-line guards, early return (no trailing `else`), braceless single-statement `if`/`foreach`/etc., invert-`if` flattening, single-line `throw`/`continue`, IDE0011 / `FORMATTING.md`. |
| **Modern language** | [`CSharp-Terse-Modern-Language.mdc`](../../.cursor/rules/CSharp-Terse-Modern-Language.mdc) | Pattern matching & `is null`, `??`/`??=`, switch expressions, `=>` members, LINQ pipelines, `[]` collection expressions, target-typed `new`, range/index. |
| **Construction & layout** | [`CSharp-Members-And-Construction.mdc`](../../.cursor/rules/CSharp-Members-And-Construction.mdc) | Primary constructors, backing-field null coalescing for DI, one-line simple properties, no stacked blank lines, named bounds / magic numbers. |

**Always-on (non-`*.cs`)** rules — agent policy, session hygiene, architecture output shape, user task discipline — live in other `.mdc` files (see `.cursor/rules/` directory listing), including [`User-Task-Discipline.mdc`](../../.cursor/rules/User-Task-Discipline.mdc).

**Supplementary:** CodeQL logging — [`CodeQL-Sanitized-Logging.mdc`](../../.cursor/rules/CodeQL-Sanitized-Logging.mdc).

---

## The non-negotiables (project-wide user rules)

These are applied above and beyond the Cursor rules — they come from the user's permanent preferences and are **never** relaxed by a terseness rule:

1. **Concrete types over `var`.** Always.
2. **Each class in its own file.** Always.
3. **Always check nulls.** Validate at the boundary, throw with the same-line guard form.
4. **One blank line before `if` and `foreach`** — except when it's the first line of the method/block.
5. **LINQ over `foreach`** unless LINQ would degrade performance (call out the perf reason in a comment if so).
6. **No `ConfigureAwait(false)` in tests.**
7. **All SQL DDL in one file per database** (`ArchLucid.sql`, plus migration scripts under `sql/migrations/`).
8. **Explain non-obvious code with a comment** ("would a developer with two years of experience understand this in 30 seconds?"). Do **not** narrate obvious code (`// Increment counter` is forbidden).
9. **Architectural intent before code.** If requirements are ambiguous, ask or state assumptions explicitly. If something becomes unclear *during* the task, say so explicitly — do not make a silent choice and move on.
10. **Modular methods are fine even if a method has only one line of code.** Reuse aggressively.
11. **Minimum code, nothing speculative.** Write only what the task requires. Do not add methods, classes, parameters, or abstractions that were not asked for.
12. **Surgical edits.** Touch only files and lines the task requires. Do not refactor, reformat, or rename outside the scope of the change.
13. **Success criteria and verification.** Before starting substantive work, state brief acceptance criteria. Do not declare the task done until those criteria are met or the user explicitly defers them.

---

## Putting it together — a worked example

Below is what a typical service method looks like when **all** the rules are applied together. Compare with the "before" form to see why the rules exist.

### Before

```csharp
public class TenantSummaryService : ITenantSummaryService
{
    private readonly ITenantRepository _repository;
    private readonly IClock _clock;

    public TenantSummaryService(ITenantRepository repository, IClock clock)
    {
        _repository = repository;
        _clock = clock;
    }

    public async Task<List<TenantSummary>> GetActiveAsync(
        Guid scopeId,
        CancellationToken ct)
    {
        if (scopeId == Guid.Empty)
        {
            throw new ArgumentException("Scope id is required.", nameof(scopeId));
        }

        var tenants = await _repository.LoadByScopeAsync(scopeId, ct);
        if (tenants == null)
        {
            tenants = new List<Tenant>();
        }

        var result = new List<TenantSummary>();
        foreach (var tenant in tenants)
        {
            if (tenant == null)
            {
                continue;
            }
            if (!tenant.IsActive)
            {
                continue;
            }
            else
            {
                result.Add(new TenantSummary(tenant.Id, tenant.Name, _clock.UtcNow));
            }
        }
        return result;
    }
}
```

### After

```csharp
public sealed class TenantSummaryService(
    ITenantRepository repository,
    IClock clock) : ITenantSummaryService
{
    public async Task<List<TenantSummary>> GetActiveAsync(Guid scopeId, CancellationToken ct)
    {
        if (scopeId == Guid.Empty) throw new ArgumentException("Scope id is required.", nameof(scopeId));
        if (repository is null)    throw new ArgumentNullException(nameof(repository));
        if (clock is null)         throw new ArgumentNullException(nameof(clock));

        IReadOnlyList<Tenant> tenants = await repository.LoadByScopeAsync(scopeId, ct) ?? [];
        DateTime now = clock.UtcNow;

        return tenants
            .Where(t => t is { IsActive: true })
            .Select(t => new TenantSummary(t.Id, t.Name, now))
            .ToList();
    }
}
```

What changed and which rule pulled the lever:

| Edit | Rule(s) |
|------|---------|
| `class … : I…` → primary ctor | **Construction & layout** bundle |
| Hand-rolled field assignment removed | **Construction & layout** (primary constructors) |
| `if (… == Guid.Empty) { throw … }` → same-line throw | **Guards & flow** bundle |
| `== null` → `is null` | **Modern language** bundle (null patterns) |
| `tenants ?? new List<Tenant>()` → `?? []` | **Modern language** (collection expressions + coalescing) |
| `var` → `IReadOnlyList<Tenant>` / `DateTime` | user rule (concrete types) |
| `foreach` + `result.Add(...)` → LINQ pipeline | **Modern language** (LINQ pipelines) |
| Property pattern `is { IsActive: true }` | **Modern language** (pattern matching) |
| Trailing `else { … }` after `continue` removed | **Guards & flow** (early return) |
| Final block reduced to `return …;` (single expression) | candidate for **Modern language** (`=>`) if extracted to its own helper |

---

## When to break the rules

Every rule lists a **Scope** section that calls out exemptions. The recurring themes:

- **Block bodies stay** when there are multiple statements, locals, `try` / `catch`, or in-method comments that need to live with the code.
- **Expression trees** (Moq `It.Is<T>(e => …)`, EF Core predicates compiled to SQL, etc.): C# disallows `is` / `is not` / other pattern forms inside expression trees (**CS8122**). Keep `== null` / `!= null` there and add a one-line comment pointing at CS8122 so reviewers know it is intentional.
- **`switch` statements stay** when arms need awaits or side effects.
- **`foreach` stays** when awaiting per element, writing to multiple sinks, or a measured allocation matters (call out the reason in a comment).
- **Explicit constructors stay** when you need overload chaining, capacity, comparer, or other ctor arguments.
- **Block guards stay** when the guard does more than throw/return/continue — e.g. logging then throwing.

When a rule and an enterprise-realism concern collide (incomplete requirements, organizational constraints, imperfect teams), prefer the **safer, clearer** form and add a one-line comment explaining why.

---

## Maintaining this doc

- **New style guidance for C#:** add a subsection under the right **bundle** file (`CSharp-Terse-Guards-And-Flow.mdc`, `CSharp-Terse-Modern-Language.mdc`, or `CSharp-Members-And-Construction.mdc`) rather than introducing new `CSharp-Terse-NN-*.mdc` shards — keeps agent context smaller.
- Retire guidance by editing the bundle; do not leave orphaned `.mdc` filenames linked from here.
- Bulk style fixes belong in `scripts/` and should be linked from [`docs/FORMATTING.md`](FORMATTING.md), not from here.

---

## Related docs

- [`docs/FORMATTING.md`](FORMATTING.md) — `dotnet format`, brace removal tool, property collapser.
- [`docs/SQL_DDL_DISCIPLINE.md`](SQL_DDL_DISCIPLINE.md) — single-DDL-file rule for SQL.
- [`docs/METHOD_DOCUMENTATION.md`](METHOD_DOCUMENTATION.md) — when and how to add comments on methods.
- [`docs/REPO_HYGIENE.md`](REPO_HYGIENE.md) — file layout, naming, and repo-level conventions.
