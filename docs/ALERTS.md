# Alerts, advisory scans, and related HTTP surface

This note ties together **operator-facing HTTP routes** and where behavior is implemented. For C# XML comment conventions and the incremental doc **piece tracker**, see [METHOD_DOCUMENTATION.md](METHOD_DOCUMENTATION.md). For policy-pack effects on alerts/compliance, see [API_CONTRACTS.md](API_CONTRACTS.md).

## Simple alert rules

| Area | Route prefix (typical) | Controller |
|------|------------------------|------------|
| Define/list metric rules | `v{version}/alert-rules` | `AlertRulesController` |
| List/act on fired alerts | `v{version}/alerts` | `AlertsController` |

Rules are stored per tenant/workspace/project. At evaluation time, enabled rules are **filtered by effective governance** (`PolicyPackGovernanceFilter.FilterAlertRules`) before `AlertEvaluator` runs.

## Composite alert rules

| Area | Route prefix | Controller |
|------|--------------|------------|
| Define/list composite rules | `v{version}/composite-alert-rules` | `CompositeAlertRulesController` |

Composite evaluation uses `AlertMetricSnapshotBuilder`, `CompositeAlertRuleEvaluator`, and `AlertSuppressionPolicy` (see piece 5–7 in `METHOD_DOCUMENTATION.md`).

## Routing & delivery

| Area | Route prefix | Controller |
|------|--------------|------------|
| Webhook/email subscriptions | `v{version}/alert-routing-subscriptions` | `AlertRoutingSubscriptionsController` |

`AlertDeliveryDispatcher` fans out to registered `IAlertDeliveryChannel` implementations (Email, Slack, Teams, on-call webhook).

## Simulation & tuning

| Area | Route prefix | Controller |
|------|--------------|------------|
| What-if rule runs | `v{version}/alert-simulation` | `AlertSimulationController` |
| Threshold sweep / scoring | `v{version}/alert-tuning` | `AlertTuningController` |

Validators: `RuleSimulationRequestValidator`, `RuleCandidateComparisonRequestValidator`, `ThresholdRecommendationRequestValidator`.

## Advisory (plans, recommendations, schedules)

| Area | Route prefix | Controller |
|------|--------------|------------|
| Improvement plan & recommendation actions | `api/advisory` | `AdvisoryController` |
| CRON schedules, run-now, digests | `api/advisory-scheduling` | `AdvisorySchedulingController` |

Scheduled runs use `IAdvisoryScanRunner` / `AdvisoryScanRunner`: ambient scope, single load of effective governance, advisory defaults on the plan, then simple + composite alert evaluation (details in `API_CONTRACTS.md`).

## Scope

All of the above rely on **`IScopeContextProvider`** (JWT claims / headers, or `AmbientScopeContext` for background jobs) so tenant, workspace, and project match stored rows and governance resolution.
