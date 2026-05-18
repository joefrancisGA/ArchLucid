> **Scope:** Contributor fast path — install order, one verification command, and where to read next; not buyer narrative, deep architecture, or operator atlas detail.

# Contributor on one page

**ArchLucid** is an AI-assisted architecture workflow (structured request → **review** (pipeline) → committed manifest, with exports and governance hooks). **Doc hub:** [START_HERE.md](START_HERE.md).

## Common tasks

| I want to… | Go here |
| --- | --- |
| **Docker-first boot (no .NET first)** | [engineering/FIRST_30_MINUTES.md](engineering/FIRST_30_MINUTES.md) |
| **Build, test, migrations** | [engineering/BUILD.md](engineering/BUILD.md) |
| **Where to change code** | [library/CONTRIBUTOR_CODE_MAP.md](library/CONTRIBUTOR_CODE_MAP.md) |
| **Architecture poster (C4)** | [architecture/README.md](architecture/README.md) |
| **HTTP API contracts** | [library/API_CONTRACTS.md](library/API_CONTRACTS.md) |
| **Deployment (internal operators)** | [engineering/DEPLOYMENT.md](engineering/DEPLOYMENT.md) |

## Copy-paste (repo root)

```bash
dotnet build ArchLucid.sln
dotnet test ArchLucid.sln
docker compose up -d
```

## Verify in one shot (Docker running)

```bash
dotnet run --project ArchLucid.Cli -- try
```

## Install + troubleshooting

[engineering/INSTALL_ORDER.md](engineering/INSTALL_ORDER.md) — pinned SDK/SQL/Node. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — ports and local failures. `dotnet run --project ArchLucid.Cli -- doctor` · `dotnet run --project ArchLucid.Cli -- support-bundle --zip` (review before sharing).

**Deeper shortcut** (duplicate layout): [engineering/CONTRIBUTOR_ON_ONE_PAGE.md](engineering/CONTRIBUTOR_ON_ONE_PAGE.md).
