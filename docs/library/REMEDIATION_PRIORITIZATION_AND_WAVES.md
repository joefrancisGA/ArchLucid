# Remediation prioritization and waves (IE-15)

Explainable, deterministic remediation prioritization with configurable waves and executive metrics. **No cloud apply.**

## Risk scoring

Weighted factors (persisted breakdown, GET explains the score):

- Severity, Exploitability, KnownExploitation, InternetExposure
- IdentityControlPlaneImpact, AssetCriticality, DataSensitivity, BlastRadius
- CompensatingControls (subtractive when active exception exists)
- RemediationComplexity, RemediationRisk

Rule version: `IE15-priority-v1`. Weights are tenant-configurable; formula is **not** LLM-backed.

## Waves

- Create by `targetSize` (any positive integer; defaults suggested: 1, 5, 25, 100, 500) **or** explicit `CloudResourceId` list.
- Members are ranked open findings; approved instances are auto-assigned via `AssignWaveAsync`.

## Metrics (`ReadAuthority`, tenant scoped)

Open count, risk-weighted open, critical exposure, created/remediated per week, net burn, recurrence, ExactMatch pattern coverage %, automation %, verification failures, exceptions active/expiring/expired, business-blocked, average age, top ControlId/PatternKey.

## API

- `GET /v1/operational-security/remediation-prioritization/ranked`
- `GET /v1/operational-security/remediation-prioritization/findings/{findingId}/score`
- `PUT /v1/operational-security/remediation-prioritization/weights`
- `POST /v1/operational-security/remediation-waves`
- `GET /v1/operational-security/remediation-metrics`
