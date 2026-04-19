# ArchLucid finding engine template (`dotnet new`)

This template scaffolds a **minimal class library plus xUnit tests** for implementing custom finding logic outside the main product repository—supporting **Marketability Improvement 6** (community seeding).

## Install (local path)

```bash
dotnet new install ./templates/archlucid-finding-engine
```

## Create a project

```bash
dotnet new archlucid-finding-engine -n Contoso.RiskFindings -o ./Contoso.RiskFindings
```

## Contents

- `ArchLucidFindingEngine/` — sample plugin-style engine class.
- `ArchLucidFindingEngine.Tests/` — unit tests you can extend toward golden fixtures.

## Publishing a standalone OSS repo

When splitting to a public GitHub repository:

1. Copy this folder verbatim as the repo root (keep `.template.config` if you still want `dotnet new` installs from Git).
2. Add `LICENSE` (MIT or Apache-2.0) and `CONTRIBUTING.md`.
3. Wire CI with `dotnet build` / `dotnet test` on the latest LTS SDK.

## Related docs

- `docs/whitepapers/state-of-ai-architecture-2026.md` — positioning companion draft.
- `docs/CONTEXT_INGESTION.md` — how architecture context becomes canonical objects.
