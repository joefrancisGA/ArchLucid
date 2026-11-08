using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceStickinessController
{
    private async Task<IActionResult?> EnsureGovernanceDispositionRunSealedManifestAllowedAsync(
        Guid? runId,
        CancellationToken cancellationToken)
    {
        if (runId is not { } resolvedRunId || resolvedRunId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        RunDetailDto? detail =
            await _authorityQueryService.GetRunDetailForManifestCompareAsync(
                scope,
                resolvedRunId,
                cancellationToken);

        // Unknown runs must reach disposition handlers so routes return 404, not sealed-manifest 409.

        if (detail is null)
            return null;

        try
        {
            GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrow(
                detail.GoldenManifest,
                resolvedRunId.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapGovernanceStickinessSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps governance stickiness <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapGovernanceStickinessSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    private async Task<IActionResult?> EnsureRiskExceptionRunSealedManifestAllowedAsync(
        Guid riskExceptionId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RiskExceptionRecord? record =
            await _riskExceptionService.GetByIdAsync(scope.TenantId, riskExceptionId, cancellationToken);

        if (record?.RunId is not { } runId || runId == Guid.Empty)
            return null;

        return await EnsureGovernanceDispositionRunSealedManifestAllowedAsync(runId, cancellationToken);
    }

    private async Task<IActionResult?> EnsureBulkDispositionSealedManifestAllowedAsync(
        IReadOnlyList<string> findingIds,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<string> normalizedFindingIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        HashSet<Guid> sealedRunIds = [];

        foreach (string normalizedFindingId in normalizedFindingIds)
        {
            FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
                scope,
                normalizedFindingId,
                cancellationToken,
                FindingInspectReadOptions.MetadataOnly);

            if (finding is null)
                continue;

            if (finding.RunId != Guid.Empty)
                sealedRunIds.Add(finding.RunId);
        }

        foreach (Guid runId in sealedRunIds)
        {
            IActionResult? guardResult =
                await EnsureGovernanceDispositionRunSealedManifestAllowedAsync(runId, cancellationToken);

            if (guardResult is not null)
                return guardResult;
        }

        return null;
    }

    private Task<IActionResult?> EnsureRecurrenceScheduleSourceRunSealedManifestAllowedAsync(
        Guid sourceRunId,
        CancellationToken cancellationToken) =>
        EnsureGovernanceDispositionRunSealedManifestAllowedAsync(sourceRunId, cancellationToken);

    private async Task<IActionResult?> EnsureRecurrenceScheduleUpdateSealedManifestAllowedAsync(
        Guid scheduleId,
        CancellationToken cancellationToken)
    {
        ArchitectureReviewRecurrenceSchedule? existing =
            await _recurrenceScheduleRepository.GetByIdAsync(scheduleId, cancellationToken);

        if (existing is null || existing.SourceRunId == Guid.Empty)
            return null;

        return await EnsureRecurrenceScheduleSourceRunSealedManifestAllowedAsync(
            existing.SourceRunId,
            cancellationToken);
    }

    private async Task<IActionResult?> EnsureRegistersSealedManifestAllowedAsync(
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid resolvedProjectId = projectId ?? scope.ProjectId;

        return await GovernanceScopePostureSealedManifestPreflight.TryGetConflictResultAsync(
            this,
            scope,
            resolvedProjectId,
            _runDetailQueryService,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);
    }

    /// <summary>
    ///     Per-waiver run sealing for list and aggregate reads. Returns HTTP 409 when any referenced run is
    ///     unsealed; callers must not filter rows or return partial aggregates.
    /// </summary>
    private async Task<IActionResult?> EnsureRiskExceptionRecordsSealedManifestAllowedAsync(
        IReadOnlyList<RiskExceptionRecord> records,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        HashSet<Guid> runIdsToSeal = [];

        foreach (RiskExceptionRecord record in records)
        {
            Guid runId = record.RunId ?? Guid.Empty;

            if (runId == Guid.Empty)
            {

                if (string.IsNullOrWhiteSpace(record.FindingId))
                {
                    continue;
                }

                FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
                    scope,
                    record.FindingId.Trim(),
                    cancellationToken,
                    FindingInspectReadOptions.MetadataOnly);

                if (finding is null || finding.RunId == Guid.Empty)
                {
                    string findingLabel = string.IsNullOrWhiteSpace(record.FindingId)
                        ? "(empty)"
                        : record.FindingId.Trim();

                    throw new ConflictException(
                        $"Decisions-needed summary blocked for waiver on finding '{findingLabel}': active risk exception has no run id and finding inspect did not resolve an attestable run.");
                }

                runId = finding.RunId;
            }

            if (!runIdsToSeal.Add(runId))
            {
                continue;
            }

            IActionResult? guardResult =
                await EnsureGovernanceDispositionRunSealedManifestAllowedAsync(runId, cancellationToken)
                    .ConfigureAwait(false);

            if (guardResult is not null)
            {
                return guardResult;
            }
        }

        return null;
    }

    private async Task<IActionResult?> EnsureRegisterRunsSealedManifestAllowedAsync(
        IEnumerable<Guid?> runIds,
        CancellationToken cancellationToken)
    {
        foreach (Guid runId in runIds
                     .Where(static runId => runId is { } value && value != Guid.Empty)
                     .Select(static runId => runId!.Value)
                     .Distinct())
        {
            IActionResult? guardResult =
                await EnsureGovernanceDispositionRunSealedManifestAllowedAsync(runId, cancellationToken)
                    .ConfigureAwait(false);

            if (guardResult is not null)
                return guardResult;
        }

        return null;
    }
}
