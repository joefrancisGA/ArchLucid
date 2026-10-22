# ABQ-04 — Replace advice/constraint phrase lists with a negation tokenizer

**Do not fork ABQ-01–03.** Do not add another `" mightn't configure to "` string.

## Goal

Architecture advice and request-constraint matching treat English **negation** as a closed-class token problem (`not`, `never`, `cannot`, `n't` contractions), not an open list of verb phrases. `GenericArchitectureAdvicePatterns.cs` and `RequestConstraintTokenMatcher.cs` shrink; new hunts cannot ship by appending one more `mightn't mandate to` variant.

## Why

Those two files are ~1,780 and ~1,743 lines. The hunt ledger mentions “negation” ~1,600 times. Recent `bugsmash` commits are titled like “didn't configure/mandate/apply/enforce to constraint negation.” That is an unclosed input space: every auxiliary × verb × preposition looks like a unique bug. Professional-architect intake uses ordinary English (`must not`, `do not`, `cannot`, `no need to`); it does not require a catalog of `mightn't provision to`.

Closed-class negation **is** finite. Open-class verb frames are not.

## Context

- `ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs` — `ContainsAdviceNegationPhrase` and similar
- `ArchLucid.Core/Requests/RequestConstraintTokenMatcher.cs`
- `ArchLucid.Core/Requests/RequestConstraintClassifier.cs` (only if the matcher API forces it)
- Tests: `ArchLucid.Core.Tests/Findings/GenericArchitectureAdvicePatternsMultiCloudTests.cs`, `ArchLucid.Core.Tests/Requests/RequestConstraintClassifierTests.cs`, plus any `*Negation*` tests under those folders

## What to build

1. Introduce a small `EnglishNegationTokenizer` (new file under `ArchLucid.Core/Requests/` or `ArchLucid.Core/Text/`, one class per file):
   - Normalize whitespace and case
   - Detect a **closed** negation set: `not`, `no`, `never`, `cannot`, `can't`, `don't`, `didn't`, `doesn't`, `hasn't`, `haven't`, `hadn't`, `shouldn't`, `wouldn't`, `couldn't`, `mustn't`, `needn't`, `mightn't`, `won't`, `isn't`, `aren't`, plus the two-word forms `must not`, `do not`, `does not`, `did not`, `can not`, `should not`, `need not`, `might not`, `no need to`
   - Apply negation to the **following** content-word span (requirement/advice verb), not by enumerating `configure|mandate|apply|enforce|provision`
2. Replace `ContainsAdviceNegationPhrase(before, " mightn't configure to ")` style lists with the tokenizer. Keep **domain** keyword lists (AWS/GCP/K8s resource terms from ID-03) — those are product vocabulary, not negation.
3. Delete hunts’ contraction×verb×preposition rows. Keep a short table of realistic architect sentences:
   - `"must not expose Redis to the internet"` → negated
   - `"do not require a public IP"` → negated
   - `"shouldn't allow SSH from 0.0.0.0/0"` → negated
   - `"require private endpoints"` → not negated
   - `"might require NAT"` → not negated (`might` without `not`)
4. `mightn't` / `needn't` as tokens still negate; you do **not** add `mightn't configure to` as a phrase.
5. Scoped tests:

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~GenericArchitectureAdvicePatterns|FullyQualifiedName~RequestConstraintTokenMatcher|FullyQualifiedName~RequestConstraintClassifier|FullyQualifiedName~EnglishNegationTokenizer"
```

6. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'`

## Acceptance criteria

- File sizes drop substantially (thousands of enumerated phrases → tokenizer + small closed-class list + domain keywords that already existed for multi-cloud).
- Realistic negated architect language still classifies as negated.
- No production string equals `" mightn't configure to "`.
- Tests do not encode `BearAccessKey`-style dictionary coverage.

## Constraints

- Do not retune insight-density or ID-03 multi-cloud **resource** patterns except where they are implemented as negation phrases.
- Do not add a new NLP library.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
