> **Scope:** How evaluators and operators install the **`archlucid`** CLI without cloning the repository.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid CLI — install

The CLI command name is **`archlucid`** (`ToolCommandName` in `ArchLucid.Cli.csproj`). Choose one path below.

## Option A — Self-contained binary (no .NET SDK)

Use this when you cannot install the .NET SDK (typical evaluator / sponsor laptop).

1. Run the GitHub Actions workflow **[Publish CLI](../../.github/workflows/publish-cli.yml)** (`workflow_dispatch`) or download artifacts from a tagged release (`cli-v*`).
2. Download the artifact for your platform:
   - `archlucid-cli-win-x64`
   - `archlucid-cli-linux-x64`
   - `archlucid-cli-osx-x64`
3. Extract the archive and place the executable on your `PATH` (Windows: `archlucid.exe`).
4. Verify:

```bash
archlucid doctor
```

Binaries are built with `PublishSingleFile=true` and `--self-contained true` per platform RID.

## Option B — .NET global tool (SDK required once)

From a machine with the [.NET 10 SDK](https://dotnet.microsoft.com/download):

```bash
dotnet tool install -g ArchLucid.Cli
```

Or install from a locally packed `.nupkg` (contributors):

```bash
dotnet pack ArchLucid.Cli/ArchLucid.Cli.csproj -c Release -o ./nupkg
dotnet tool install -g ArchLucid.Cli --add-source ./nupkg
```

Update:

```bash
dotnet tool update -g ArchLucid.Cli
```

Verify:

```bash
archlucid doctor
```

## Option C — Run from repository clone (contributors)

From the repo root (requires SDK + restore):

```bash
dotnet run --project ArchLucid.Cli -- doctor
```

See [BUILD.md](BUILD.md) and [INSTALL_ORDER.md](INSTALL_ORDER.md) for full contributor setup.

## Configuration

After install, point the CLI at your API (local or hosted):

| Source | Key |
|--------|-----|
| `archlucid.json` in the working directory | `apiUrl` |
| Environment | `ARCHLUCID_API_URL` |

Full command reference: [CLI_USAGE.md](../library/CLI_USAGE.md). Operator quickstart: [OPERATOR_QUICKSTART.md](../library/customer-facing/OPERATOR_QUICKSTART.md).

## SSO role-claim triage

When JWT SSO succeeds but API calls return **403**, diagnose role mapping (Admin API key required):

```bash
archlucid auth test-token --bearer "<jwt>"
```

See [GENERIC_OIDC_SETUP.md](../runbooks/GENERIC_OIDC_SETUP.md) and [FIRST_PILOT_TROUBLESHOOTING.md](../runbooks/FIRST_PILOT_TROUBLESHOOTING.md).
