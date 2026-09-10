# ABQ-02 — Rewrite configuration sensitive-path matching

**Do not fork ABQ-01.** Reuse the shared tokenizer/matcher ABQ-01 added under `ArchLucid.Core/Security/` (or the equivalent path ABQ-01 created). If ABQ-01 is not merged yet, **stop** and say so — do not paste a second tokenizer.

## Goal

Operator configuration summaries redact real secret **segments** (`ConnectionStrings:Default`, `ArchLucid:AdminPassword`, `ArchLucid:OpenAiApiKey`, `ArchLucid:GraphClientSecret`, `ArchLucid:Jwt:SigningKey`, `ArchLucid:ServiceBus:SharedAccessKey`) and do **not** treat `PasswordlessAuth` / `ApiKeyizerModule` as hunt-driven suffix bugs. The matcher is segment-based (`:`-split) and token-based (ABQ-01), not `Contains("Password")` on the full path.

## Why

Scratch probe on 2026-09-06 `master` against `ConfigurationSensitiveConfigPathMatcher`:

```text
ConnectionStrings:Default                redacted=True
ArchLucid:AdminPassword                  redacted=False
ArchLucid:OpenAiApiKey                   redacted=False
ArchLucid:GraphClientSecret              redacted=False
ArchLucid:ClientCertificatePassword      redacted=False
ArchLucid:PasswordlessAuth:Mode          redacted=False
```

`ArchLucid.Core/Configuration/Summary/ConfigurationSensitiveConfigPathMatcher.cs` (~731 lines) accumulated the same embedded-fragment + suffix-guard + explicit-credential treadmill as the Azure redactor. Operator summaries are a professional-architect surface; leaking `AdminPassword` / API keys is the defect, not failing to special-case `ApiKeyizerModule`.

## Context

- `ArchLucid.Core/Configuration/Summary/ConfigurationSensitiveConfigPathMatcher.cs` — `IsSensitiveConfigPath`, `IsSensitiveConfigSegment`, `IsExplicitCredentialConfigSegment`, suffix guards
- Tests: search `ArchLucid.Core.Tests` for `ConfigurationSensitiveConfigPathMatcher` / `ConfigurationEffectiveValueResolver` / `Resolve_returns_scalar_for_non_secret_segment_substrings` / `Resolve_redacts_*_config_path`
- Callers: `ArchLucid.Core/Configuration/Summary/` (effective-value resolver / operator summary). Do not change summary **layout**.

## What to build

1. Split the path on `:`. Trim segments. A path is sensitive if **any** segment matches the shared credential matcher from ABQ-01, or the existing trailing `:Key` rule if product still wants a final segment exactly `Key`.
2. Delete per-segment suffix lists (`less`/`free`/`izer`) and the duplicated explicit-credential equality tables once the tokenizer covers `SharedAccessKey`, `SigningKey`, `PrimaryAccessKey`, `ClientSecret`, `PrivateKey`, `ApiKey` as tokens/pairs.
3. Keep `PasswordlessAuth` **not** sensitive (token `passwordless`, not `password`).
4. Replace treadmill tests with a short theory:
   - Redact: `ConnectionStrings:Default`, `ArchLucid:AdminPassword`, `ArchLucid:SqlAdminPassword`, `ArchLucid:OpenAiApiKey`, `ArchLucid:GraphClientSecret`, `ArchLucid:Jwt:SigningKey`, `ArchLucid:ServiceBus:SharedAccessKey`, `ArchLucid:ClientCertificatePassword`
   - Do not redact: `ArchLucid:PasswordlessAuth:Mode`, `ArchLucid:Host:PublicBaseUrl`, empty/whitespace path
5. Delete tests whose only input is a fictional `*izer` / `*less` / `*free` compound invented by a hunt.
6. Scoped tests covering matcher + resolver:

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~ConfigurationSensitiveConfigPathMatcher|FullyQualifiedName~ConfigurationEffectiveValueResolver"
```

7. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'`

## Acceptance criteria

- The 2026-09-06 fail-open config paths above redact (except `PasswordlessAuth:Mode`).
- Matcher file is a thin adapter over the shared ABQ-01 type, not a second 700-line allowlist.
- No new hunt-driven suffix guard.

## Constraints

- Do not re-edit `AzureExtractorSensitivePropertyRedactor.cs` except a one-line call-site if ABQ-01 left a TODO for sharing — prefer zero Azure file edits.
- Do not change what the summary **displays** besides redaction of secret values.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
