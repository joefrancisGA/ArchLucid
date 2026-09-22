#Requires -Version 5.1
<#
.SYNOPSIS
  Prints non-blocking defect-prevention suggestions for changed paths.

.DESCRIPTION
  This is intentionally advisory. It never changes files, runs no tests, and
  always exits zero so it cannot block commits, builds, or merges.
#>
param(
    [string] $BaseRef = 'HEAD'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Advisory([string] $Message) {
    Write-Host "ADVISORY: $Message"
}

try {
    $repoRoot = (git rev-parse --show-toplevel 2>$null)
    if (-not $repoRoot) {
        Write-Advisory 'Run this command from inside the ArchLucid git repository.'
        exit 0
    }

    $changed = @(git diff --name-only $BaseRef 2>$null)
    if ($LASTEXITCODE -ne 0) {
        Write-Advisory "Could not compare against '$BaseRef'. Try -BaseRef <commit-or-branch>."
        exit 0
    }

    if ($changed.Count -eq 0) {
        Write-Advisory "No working-tree changes relative to $BaseRef."
        exit 0
    }

    Write-Host "Defect-prevention suggestions for $($changed.Count) changed path(s):"
    $normalized = $changed -join "`n"

    if ($normalized -match '(^|\n)(ArchLucid\.Api/Controllers/|.*Controller\.cs$|.*Endpoint.*\.cs$)') {
        Write-Advisory 'API change: review authorization, tenant/object scope, validation, stable errors, idempotency, and typed audit events; add or update a contract test when the wire behavior changes.'
    }
    if ($normalized -match '(^|\n)(ArchLucid\.Persistence|.*Migration.*\.cs$|.*\.sql$)') {
        Write-Advisory 'Persistence change: document rollout compatibility, retry/partial-failure behavior, backfill, recovery, and query scope/pagination; validate migrations against production-shaped data where practical.'
    }
    if ($normalized -match '(^|\n)archlucid-ui/') {
        Write-Advisory 'UI change: check loading, empty, error, permission-denied, stale-data, and double-submit states.'
    }
    if ($normalized -match '(appsettings|Configuration|Options|\.ya?ml$|\.json$)') {
        Write-Advisory 'Configuration change: check defaults, invalid combinations, environment overrides, secret handling, and backward compatibility.'
    }
    if ($normalized -match '(package-lock\.json|package\.json|\.csproj$|Directory\.Packages\.props$)') {
        Write-Advisory 'Dependency change: inspect release notes, lockfile/transitive changes, licensing, and rollback options.'
    }
    if ($normalized -match '(Date|Time|Money|Currency|Amount|Rate)') {
        Write-Advisory 'Date/time or numeric domain change: confirm UTC, culture-independent parsing, rounding, and range boundaries.'
    }
    if ($normalized -match '(^|\n)(ArchLucid\.(Core|Application|Decisioning|KnowledgeGraph|ArtifactSynthesis)/|.*(Validator|Parser|Converter|Resolver)\.cs$)') {
        Write-Advisory 'Domain transformation change: define the invariant at the boundary and add generative or table-driven cases for malformed, extreme, and unexpected inputs.'
    }
    if ($normalized -match '(^|\n)(ArchLucid\.(Api|Worker|Jobs|Integrations\.)|.*(Background|Worker|Job|Handler)\.cs$)') {
        Write-Advisory 'Service or job change: emit structured, redacted diagnostics with a correlation ID for each failure and retry path.'
    }
    if ($normalized -match '(FeatureFlag|FeatureFlags|FeatureManagement|appsettings|Configuration|Options|\.ya?ml$|\.json$)') {
        Write-Advisory 'Flag or configuration change: identify the safe default, disabled-path behavior, rollout owner, retirement condition, and a fast rollback path.'
    }
    if ($normalized -match '(\.csproj$|Directory\.Build\.props$|Directory\.Packages\.props$|\.editorconfig$|\.ruleset$)') {
        Write-Advisory 'Build or analysis configuration change: preserve Release warning-as-error and analyzer coverage; add a targeted rule only when it prevents a demonstrated recurring defect.'
    }
    if ($normalized -match '(^|\n)(.*Tests?/|.*\.Tests/|stryker-config|mutation)') {
        Write-Advisory 'Test-surface change: consider mutation testing for high-risk domain logic and confirm the new test fails when the intended behavior is deliberately broken.'
    }
    if ($normalized -match '(Api\.Client|openapi|OpenAPI|contract|Contracts|\.schema\.json$)') {
        Write-Advisory 'Contract change: add consumer-driven coverage for SDK and UI callers, including an older-client or unknown-field compatibility case.'
    }
    if ($normalized -match '(^|\n)(deploy/|infra/|\.github/workflows/|Dockerfile|helm|kustomize|release|rollout)') {
        Write-Advisory 'Deployment change: define a production-like canary check, its abort threshold, and the exact rollback signal before rollout.'
        Write-Advisory 'Deployment or infrastructure change: rehearse the rollback or restore path periodically and link the runbook or evidence in the change.'
    }
    if ($normalized -match '(^|\n)(ArchLucid\.Api/Controllers/|.*Controller\.cs$|.*Endpoint.*\.cs$)') {
        Write-Advisory 'Endpoint change: verify rate-limit and authorization metadata are present and covered by a negative test for every newly exposed operation.'
    }
    if ($normalized -match '(^|\n)(ArchLucid\.(Integrations|Worker|Jobs|AgentRuntime)/|.*(Integration|Worker|Job|Handler).*\.cs$)') {
        Write-Advisory 'External or asynchronous dependency change: add a failure-injection or chaos case for timeout, retry, duplicate delivery, and partial response behavior.'
    }
    if ($normalized -match '(\.json$|\.schema\.json$|Dto|Contract|Event|Message|Serialization|Serializer)') {
        Write-Advisory 'Wire or persisted-shape change: compare the generated/serialized diff and test renamed fields, added enum values, unknown fields, defaults, and round trips.'
    }
    if ($normalized -match '(\.sql$|Migration|DbUp|lock$|package-lock|Directory\.Packages\.props|generated|OpenAPI|openapi)') {
        Write-Advisory 'Generated, migration, or dependency diff: review the generated artifact and lock/schema delta separately from source changes before approval.'
    }
    Write-Advisory 'For recurring escapes, tag the subsystem and failure class in the defect log; use the highest-repeat category to choose the next prevention investment.'

    Write-Advisory 'For a bug fix, retain a reproducible failing scenario, add a focused regression test whenever feasible, and check the nearest boundary case.'
    Write-Advisory 'Record one focused local command or manual scenario that a reviewer can repeat.'
    Write-Advisory 'After an escaped defect, capture the missed assumption and one concrete preventive action in the defect log or post-incident review.'
}
catch {
    Write-Advisory "Unable to generate suggestions: $($_.Exception.Message)"
}

exit 0
