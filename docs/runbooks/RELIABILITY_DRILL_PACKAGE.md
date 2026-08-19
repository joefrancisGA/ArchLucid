> **Scope:** Lightweight, non-destructive reliability rehearsal tied to observable health probes.

## Inputs

| Input | Meaning |
|---|---|
| **`BaseUrl`** | API host (**HTTPS** staging or local); never a shared destructive environment |
| **TimeoutSeconds** | Web request ceiling for scripted probes |

## Outputs

Artifacts land under **`dist/reliability-drill/`**:

| Artefact | Format |
|---|---|
| `evidence-summary.json` | Structured pass/fail with probe metadata |
| `evidence-summary.md` | Sponsor-friendly mirror for ticket attachment |

Generation command (PowerShell):

```powershell
pwsh scripts/reliability_drill.ps1 -BaseUrl https://<staging-host>
```

Local host example:

```powershell
pwsh scripts/reliability_drill.ps1 -BaseUrl https://localhost:7145
```

## Query / metric cues (recovery validation)

Interpret **`GET /health/ready`** decomposition per dependency before declaring recovery:

| Signal | Operational meaning |
|---|---|
| **SQL readiness** failing | Connectivity / auth / failover path — follow database runbooks (`docs/runbooks/` SQL family) |
| **Blob/offload** degraded | Artefact offload path — investigate storage identity + SAS scope |
| **Outbox gauges** trending up | Producer faster than worker — inspect worker scale + DLQ backlog |

_Map exact workbook tiles to your Grafana / Azure Monitor deployment; this document names ArchLucid metrics families only._

## Constraints

_No destructive DDL, no deliberate tenant bleed, no public SMB._

This drill complements chaos jobs (`Tier 2b — Simmy`) by producing **cheap, repeatable** artefacts an operator can archive after each rehearsal.
