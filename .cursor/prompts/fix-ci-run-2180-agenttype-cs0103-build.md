# Fix: CI run #2180 — CS0103 `AgentType` not in scope (cascading build failure)

**Run:** 27488816955 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Commit:** `3c0ec5b5979cf11cc3c4a2b8e9a21b10d7ff7119`

## Symptom

Four jobs fail with the **same root-cause build error**:

```
/ArchLucid.AgentRuntime/CriticFindingConfidenceNormalizer.cs(19,33):
error CS0103: The name 'AgentType' does not exist in the current context
[ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj]
Build FAILED. 1 Error(s)
```

Affected jobs:
- `CI: prompt-injection regression (strict + block layer)`
- `Containers: Docker build smoke`
- `.NET: OpenAPI v1 contract snapshot (fail-fast)`
- `Go-to-market: demo workspace pins (manifest vs docs + seeds)`

## Root cause

`CriticFindingConfidenceNormalizer.cs` uses `AgentType.Critic` at line 19, but the file only imports:

```csharp
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
```

`AgentType` lives in `ArchLucid.Contracts.Common` — that `using` directive is absent.

## Fix

Add the missing `using` to `ArchLucid.AgentRuntime/CriticFindingConfidenceNormalizer.cs`:

```csharp
using ArchLucid.Contracts.Common;
```

Insert it as the first `using` (alphabetical order before `ArchLucid.Contracts.Agents`), or immediately after the existing directives — whichever matches the file's current ordering style.

**File:** `ArchLucid.AgentRuntime/CriticFindingConfidenceNormalizer.cs`

No logic changes; the enum `AgentType.Critic` is already used correctly at line 19 and the corresponding test in `CriticFindingConfidenceNormalizerTests.cs` already compiles against it.

## Acceptance criteria

1. `ArchLucid.AgentRuntime/CriticFindingConfidenceNormalizer.cs` compiles without CS0103.
2. `ArchLucid.Backend.slnf` compile check passes:
   ```powershell
   .\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"
   ```
3. No other file changes — this is a single-line using-directive addition.

## Verification

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj"
```

## Related

- Cascades to Docker build, OpenAPI snapshot, and demo workspace pins — all four failures resolve once the build is fixed.
- `ArchLucid.Contracts.Common.AgentType` enum is defined in `ArchLucid.Contracts/Common/AgentType.cs`.
