# SN-RT-09 — Uploaded config parsers (Option D)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option D.** **Depends on:** SN-RT-02 parse rules (reuse). **Do not** implement SN-RT-10 (confirm UI) except a proposed-edge DTO the UI can consume.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Accept operator-uploaded **non-secret** config extracts and emit **proposed** hostname/catalog edges the same way app-settings hosts work. Formats: `appsettings.json` / `appsettings.*.json`, `.env` / `.env.example`, Docker Compose `environment:` maps, and existing `terraform-show-json` (reuse parser; do not reimplement Terraform).

## Why

Reader may be unavailable, env may be Key Vault–only (`secretRef`), or dependencies live in another subscription. `terraform show -json` already ingests as architecture context (`docs/integrations/TERRAFORM_STATE_IMPORT.md`) but does not emit Data Flow `hostnameInferredTarget`. Appsettings uploads are the owner’s preferred compromise vs pulling live Terraform.

## Context

- `ArchLucid.ContextIngestion.Infrastructure.TerraformShowJsonInfrastructureDeclarationParser`
- `InfrastructureDeclarationRequestValidator` allowed formats
- SN-RT-02 host/catalog extractors
- `ProvenanceKind.DeterministicInference` for **proposals** (unconfirmed)

## What to build

1. New context document format(s) **or** extend infrastructureDeclarations with `format`: `appsettings-json`, `dotenv`, `compose-env` (names locked in tests). Size cap like Terraform (document it).
2. Walk string values only. Reuse SN-RT-02 extractors. Redact: never store unmatched secret-like values; skip keys matching `__ApiKey`, `Password`, `Secret` unless the value is a URL/host.
3. Terraform show-json: from `azurerm_container_app` `template[0].container[0].env` values (and `azurerm_linux_web_app` `app_settings` / `connection_string`) extract hosts — **sensitive_values** stay `[REDACTED]` (no parse of redacted).
4. Output proposed edges: `fromLabel` / `fromArmId` if match, `toHost`, `toCatalog`, `settingName`, `sourceFileFormat`, `provenanceKind=DeterministicInference`.
5. Tests: sample appsettings with SQL connection string → proposed SQL host+catalog; `.env` `ARCHLUCID_API_BASE_URL=https://api.example.com` → host; password key with random string → dropped; terraform fixture env URL → proposal; redacted sensitive → no false host.

## Acceptance criteria

Uploads produce proposed edges without a live Azure call. Secrets not persisted. Terraform ingest not broken.

## Constraints

- Working-tree check. Do **not** auto-commit proposals onto Data Flow as HumanAssertion (SN-RT-10).
- Do **not** run `terraform` on the host. Do **not** Kudu.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter 'FullyQualifiedName~AppSettings|FullyQualifiedName~Dotenv|FullyQualifiedName~ComposeEnv|FullyQualifiedName~TerraformShowJson'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion/ArchLucid.ContextIngestion.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Three formats + terraform env walk have tests. Proposals are inference, not confirmed.
