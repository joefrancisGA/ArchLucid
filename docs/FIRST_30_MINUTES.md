# First 30 minutes with ArchLucid (operator)

> **Scope:** A single-page path that takes a first-time **operator** from `git clone` to "I committed a manifest and saw a finding." If you are a developer, SRE, or security engineer, start at the persona Day-1 doc instead — see [docs/onboarding/](onboarding/).
>
> **Status:** Draft scaffold added 2026-04-20 to compress cognitive load. Screenshots are placeholders; commands are derived from existing scripts. Validate locally and update the screenshots before pinning from the README.

This page intentionally does **not** explain the layer model, the seam tests, the trial enforcement, or the marketplace flow. Those exist and are documented elsewhere — but on minute zero they are noise. Get a manifest committed first, then come back.

---

## Prerequisites (verify in 60 seconds)

- Windows 10/11, macOS, or Linux with [.NET 10 SDK](https://dotnet.microsoft.com/download).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.
- Node.js 22+ (only required for step 9 — the operator UI).
- ~6 GB free disk for SQL Server + Azurite + image cache.

If any of these is missing, install it before starting; otherwise step 2 will fail in a way that is hard to diagnose.

---

## The 10 commands

Run them in order, in a fresh terminal at the repo root. Expected wall-clock time: 25–30 minutes on a developer laptop the first time, ~6 minutes on subsequent runs.

### 1. Clone and enter the repo

```bash
git clone https://github.com/joefrancisGA/ArchLucid.git
cd ArchLucid
```

**Expect:** repo at HEAD of `main`. Go to step 2.

![cloned repo](placeholder-step-1.png)

### 2. Bring up SQL Server, Azurite, and Redis in Docker

```bash
dotnet run --project ArchLucid.Cli -- dev up
```

**Expect:** three containers healthy after ~90 seconds. SQL Server on `localhost,1433`, Azurite on `localhost:10000–10002`, Redis on `localhost:6379`.

If `dev up` complains about port conflicts, stop competing local services and rerun. Go to step 3.

![dev up containers healthy](placeholder-step-2.png)

### 3. Start the API (DbUp will run migrations automatically)

```bash
dotnet run --project ArchLucid.Api
```

**Expect:** the API listening on `http://localhost:5072` (or whatever port the launchSettings shows). DbUp creates the `ArchLucid` database and applies every migration in `ArchLucid.Persistence/Migrations/` in order. **Leave this terminal running.** Open a new terminal for step 4.

![api startup logs](placeholder-step-3.png)

### 4. Confirm the API is healthy

```bash
curl -sS http://localhost:5072/health/ready
```

**Expect:** `200 OK` with a JSON body listing `Db`, `Schema`, `CompliancePack`, and `TempDir` as `Healthy`. If you see anything else, stop here and read [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) — the rest of the steps assume readiness. Go to step 5.

### 5. Run the doctor command

```bash
dotnet run --project ArchLucid.Cli -- doctor
```

**Expect:** a section-by-section pass report covering API reachability, DB migration version, and storage. This is the same checklist you would run before reporting an issue. Go to step 6.

### 6. Create your first run from the seeded sample request

```bash
dotnet run --project ArchLucid.Cli -- run create --request enterprise-rag-request.json
```

**Expect:** a JSON response with a `runId` GUID and `status: Created`. Copy the `runId` — you'll use it in step 7. Go to step 7.

![run create output](placeholder-step-6.png)

### 7. Execute the run

```bash
dotnet run --project ArchLucid.Cli -- run execute --run-id <paste-runId-from-step-6>
```

**Expect:** the agents (Topology, Cost, Compliance, Critic) execute against the seeded request. Wall time: ~30–90 seconds depending on whether you have an LLM key configured (the simulator runs without one). The CLI prints the manifest version when the commit completes. Go to step 8.

### 8. Read the committed manifest and any findings

```bash
dotnet run --project ArchLucid.Cli -- run show --run-id <runId>
```

**Expect:** manifest version, scope, and a list of findings with severity. **You have completed the Core Pilot loop.** Go to step 9 if you want to see the same output in the UI.

![run show with findings](placeholder-step-8.png)

### 9. (Optional) Open the operator UI

```bash
cd archlucid-ui && npm install && npm run dev
```

**Expect:** Next.js on `http://localhost:3000`. Open it, log in with the development bypass, and navigate to **Runs → your run** to see the manifest, findings, and `View trace` link.

### 10. Tear everything down when you're done

```bash
dotnet run --project ArchLucid.Cli -- dev down
```

**Expect:** containers stopped and removed. The database volume persists by default; pass `--purge` to drop it as well.

---

## What you just proved

- The full Core Pilot loop works end-to-end on your machine: **request → run → execute → committed manifest → reviewable findings**.
- The CLI, API, and UI agree on the same `runId` and the same trace ID.
- DbUp ran every migration cleanly against an empty catalog.

---

## Next, depending on your role

| If you want to… | Read |
|---|---|
| Understand what each layer (Core Pilot / Advanced Analysis / Enterprise Controls) means commercially | [docs/EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md) and [docs/PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) |
| See how the run is traced through OpenTelemetry | [docs/OBSERVABILITY.md](OBSERVABILITY.md) and [docs/runbooks/TRACE_A_RUN.md](runbooks/TRACE_A_RUN.md) |
| Understand why the auth defaults are fail-closed | [docs/SECURITY.md](SECURITY.md) |
| Plan a deployment to Azure | [docs/DEPLOYMENT.md](DEPLOYMENT.md) and [docs/DEPLOYMENT_TERRAFORM.md](DEPLOYMENT_TERRAFORM.md) |

If you got stuck at any step, [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) is the right place — issues with `dev up`, DbUp, or `/health/ready` are common on first install and well-covered there.
