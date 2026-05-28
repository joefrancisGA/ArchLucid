# Agent output quality — pilot strict-mode recipe

**Audience:** Pilot operators and platform admins configuring a staging or customer pilot host.

**Last reviewed:** 2026-05-28

---

## Modes

| Mode | Behavior | Typical use |
| --- | --- | --- |
| **WarnOnly** | Quality gate evaluates traces but does not block commits by default | Local dev, first-touch demos |
| **PilotStrict** | Rejects agent output below configured floors; may block run completion when enforcement flags are on | Staging, design-partner pilots, production-like hosts |

Configuration root: `ArchLucid:AgentOutput:QualityGate` (see [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md)).

## Check effective posture

```http
GET /v1/admin/diagnostics/quality-gates
```

CLI alternative after auth is configured:

```powershell
dotnet run --project ArchLucid.Cli -- doctor
```

Look for **WarnOnly vs PilotStrict**, **EnforceOnReject**, **BlockRunOnReject**, and PilotStrict floor values.

## Recommended pilot recipe (staging)

1. Set **`Mode: PilotStrict`** on the pilot host (committed `appsettings.Staging.json` is the reference).
2. Keep **`PilotStrictMinAgentResultFaithfulnessSupportRatio`** at **0.7** unless the buyer explicitly accepts a lower bar.
3. Enable **`EnforceOnReject: true`** when you want rejected traces surfaced to operators.
4. Enable **`BlockRunOnReject: true`** only when the pilot charter requires hard stops (buyer expects zero low-quality commits).
5. Leave **`appsettings.Development.json`** on WarnOnly for engineer laptops.

Per-tenant override (when needed): `PUT /v1/admin/settings/agent-output-quality-gate-mode` — audit event **`TenantAgentOutputQualityGateModeUpdated`**.

## When output is rejected

| Symptom | Likely cause | Operator action |
| --- | --- | --- |
| Run stuck at **ExecutionCompletedQualityRejected** | PilotStrict floor not met | Inspect agent traces; check retrieval grounding panel on the review |
| Sponsor packet missing expected findings | BlockRunOnReject prevented commit | Re-run execute after fixing evidence/retrieval; do not manually edit SQL |
| Warn-only warnings in logs | WarnOnly or EnforceOnReject false | Document warnings in pilot notes; escalate if warnings appear on every agent |

Rollback: revert tenant override (`DELETE …/agent-output-quality-gate-mode`) or temporarily set host **`Mode: WarnOnly`** — document the change in the pilot charter.

## Sponsor-safe language

- Say: *"PilotStrict mode blocked output that did not meet our evidence and faithfulness floors."*
- Do not say: *"The AI was wrong"* without citing the specific gate (structural, semantic, citation coverage, or faithfulness ratio).

## Related

- [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) — quality gate rejection path
- [`OPERATIONS_ADMIN.md`](../library/OPERATIONS_ADMIN.md) — admin diagnostics routes
- [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) — tenant override audit events
