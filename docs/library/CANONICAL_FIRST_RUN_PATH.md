> **Scope:** Single canonical minimum viable first-run path for V1 pilot operators (seven mandatory steps). Advanced flows are secondary.

# Canonical first-run path (V1 pilot)

**Audience:** Buyer operators, design partners, and sales engineers running the first architecture review.

**Last reviewed:** 2026-06-12

**Operational detail:** [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)  
**Integration commitments (V1 vs V1.1):** [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) § Commitment boundary  
**Contributor/engineer path (not customer):** [`../engineering/FIRST_30_MINUTES.md`](../engineering/FIRST_30_MINUTES.md)

---

## Seven mandatory steps

| Step | Action | Command / surface | Success signal |
| --- | --- | --- | --- |
| **1** | Confirm platform prerequisites | `.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile FirstPilotMinimum` | No **BLOCK** rows |
| **2** | Run first-run preflight | `dotnet run --project ArchLucid.Cli -- --json pilot preflight` | No **BLOCK** rows |
| **3** | Readiness-only proof (no committed review yet) | `.\scripts\collect-first-pilot-proof.ps1` | `first-pilot-command-center.md` shows phased status |
| **4** | Sign in and start one architecture review | Operator UI `/reviews/new` or `POST /v1/architecture/request` | `runId` captured |
| **5** | Commit the review package | `POST /v1/architecture/run/{runId}/commit` (or UI finalize) | `goldenManifestId` present |
| **6** | Collect committed-run proof | `.\scripts\collect-first-pilot-proof.ps1 -RunId <runId>` | `first-pilot-evidence/first-value-report.md` attached |
| **7** | Sponsor handoff only when SEND-eligible | `.\scripts\collect-first-pilot-proof.ps1 -RunId <runId> -SponsorHandoff -FailOnHold` | `sponsorPacketDisposition` not **HOLD**; `sendEligible` true |

Stop at step 3 when the environment is not ready. Do not sponsor-send until step 7 passes with **COMPLETE** ROI baseline completeness (see [`ROI_BASELINE_SEND_POLICY.md`](../go-to-market/ROI_BASELINE_SEND_POLICY.md)).

---

## One script entry point

```powershell
.\scripts\Run-CanonicalFirstPilotPath.ps1 -Phase Readiness
.\scripts\Run-CanonicalFirstPilotPath.ps1 -Phase CommittedProof -RunId '<run-guid>'
.\scripts\Run-CanonicalFirstPilotPath.ps1 -Phase SponsorHandoff -RunId '<run-guid>' -FailOnHold
```

---

## Secondary (not first-run)

Operate compare/replay/graph lanes, V1.1 connectors, MCP, marketplace checkout, and broad integration catalog reading are **out of scope** for the default first run. See [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) § Ignore for first pilot.
