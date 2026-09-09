using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Posture;
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

        try
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                resolvedRunId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

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

    private async Task<IActionResult?> EnsureRecurrenceScheduleSourceRunSealedManifestAllowedAsync(
        Guid sourceRunId,
        CancellationToken cancellationToken)
    {
        if (sourceRunId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            await RecurrenceScheduleCreateSealedManifestHashGuard.EnsureSourceRunSealedManifestHashOrThrowAsync(
                sourceRunId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

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

        try
        {
            await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                resolvedProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
