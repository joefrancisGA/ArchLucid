# ABQ-01 — Rewrite Azure extractor sensitive-property redaction

**Do not fork ABQ-02.** This prompt owns `AzureExtractorSensitivePropertyRedactor` and a **shared** tokenizer ABQ-02 will import. Do not edit `ConfigurationSensitiveConfigPathMatcher.cs` here.

## Goal

ARM / extractor property keys that are real secrets redact; fictional dictionary prefixes stop being a hunt surface. `IsSensitiveKey("adminPassword")` is true. `IsSensitiveKey("beefAccessKey")` may still be true (adjacent `access`+`key`) — that is **not** a new allowlist entry; it falls out of the tokenizer. `IsSensitiveKey("location")` stays false. `IsSensitiveKey("passwordless")` / `PasswordlessAuth` stay false because they are single non-secret tokens, not because of a `less` suffix guard.

## Why

`ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs` grew to ~660 lines of `normalized.Equals("bearaccesskey")` (and hundreds of siblings) after hunt #884 added `IsEmbeddedSensitiveFragment`: any sensitive fragment preceded by a letter is skipped. That describes almost every camelCase ARM key. Scratch probe on 2026-09-06 `master`:

```text
adminPassword                    redacted=False
storageAccountAccessKey          redacted=False
sshPrivateKey                    redacted=False
servicePrincipalClientSecret     redacted=False
sqlAdminPassword                 redacted=False
beefAccessKey                    redacted=True
```

Over-redacting `PasswordlessAuth` is conservative and is **not** a shippable defect. Under-redacting `adminPassword` is.

## Context

- `ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs` — delete `IsExplicitCredentialKey` fictional list, `IsEmbeddedSensitiveFragment`, and per-suffix `less`/`free`/`izer` as the primary mechanism
- `ArchLucid.Core.Tests/AzureExtractor/AzureExtractorSensitivePropertyRedactorTests.cs` — ~3,200 lines of per-word facts; replace with a small realistic fixture, do not keep one test per dictionary word
- Call sites: `ArchLucid.Core/AzureExtractor/AzureExtractorPackageInventoryReader.cs`, `ArchLucid.Application/InfraEvidence/AzureInventorySnapshotMaterializer.cs`
- Put the shared tokenizer in a **new** type under `ArchLucid.Core/` (one class per file), e.g. `ArchLucid.Core/Security/SensitiveNameTokenizer.cs` + `SensitiveCredentialNameMatcher.cs`. Public enough for ABQ-02 (`Configuration.Summary`) to call without InternalsVisibleTo hacks if that would block ABQ-02; `internal` + `InternalsVisibleTo` for tests is fine if ABQ-02 can still use it from Core.

## What to build

1. **Tokenize** property keys:
   - Split on `-`, `_`, `.`, `:`, `/`
   - Split camelCase / PascalCase (`adminPassword` → `admin`, `password`; `storageAccountAccessKey` → `storage`, `account`, `access`, `key`; `PasswordlessAuth` → `passwordless`, `auth`)
   - Lowercase tokens
2. **Match** a **closed** token/pair set only (do not grow this from hunts without an ARM/docs citation):
   - Single tokens: `password`, `secret`, `connectionstring`
   - Adjacent pairs: `(access, key)`, `(account, key)`, `(api, key)`, `(private, key)`, `(primary, key)`, `(secondary, key)`, `(signing, key)`, `(connection, string)`, `(client, secret)`, `(shared, access, key)` as a triple
   - Certificate **credentials** only: `(certificate, password)`, `(certificate, thumbprint)`, `(certificate, pem)`, `(certificate, pfx)`, `(certificate, path)` when `path` is adjacent to `certificate`/`signing`. Do **not** treat a lone inventory `certificateName` as a secret unless product docs already required that — if today’s tests depend on redacting every `certificate*` fragment, keep fail-closed for `certificate` + credential suffix and add a comment; do not restore unbounded `Contains("certificate")`.
3. Default **fail-closed** when a token is `password` or `secret` even with a vendor prefix (`sqlAdminPassword`, `jumpboxAdminPassword`).
4. `RedactValue` stays `[REDACTED]` / empty for blank.
5. Rewrite tests to a **short** theory of realistic keys (ARM VM `osProfile.adminPassword`, storage account keys, Cosmos/Redis primary keys, SP client secrets, SSH private keys, `connectionString`) plus negative controls (`location`, `sku`, `adminUsername`, `passwordless`, `PasswordlessAuth`, `nonsecret` as a single token). Delete the `bear`/`bacon`/`yacht`/`accesskeyless` cases.
6. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'`
7. Tests:

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~AzureExtractorSensitivePropertyRedactorTests|FullyQualifiedName~SensitiveCredentialNameMatcherTests"
```

## Acceptance criteria

- `adminPassword`, `storageAccountAccessKey`, `sshPrivateKey`, `servicePrincipalClientSecret`, `sqlAdminPassword`, `redisPrimaryKey` / `primaryKey`, `connectionString` → sensitive.
- `location`, `adminUsername`, `passwordless`, `PasswordlessAuth` → not sensitive.
- Production file has **no** per-prefix `*accesskey` equality list.
- Test file is hundreds of lines, not thousands, and does not encode dictionary words as product behavior.
- ABQ-02 can import the matcher without copying the algorithm.

## Constraints

- Do not edit `ConfigurationSensitiveConfigPathMatcher.cs` (ABQ-02).
- Do not add `less`/`free`/`izer` suffix tables as the design.
- Do not keep “parity with config matcher” by copying its current fail-open bugs.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
