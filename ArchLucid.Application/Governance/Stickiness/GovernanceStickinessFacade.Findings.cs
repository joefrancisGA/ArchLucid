using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
    /// <inheritdoc />
    public async Task<FindingDispositionEventDto> RecordDispositionAsync(
        RecordFindingDispositionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        FindingInspectResponse finding = await RequireFindingInspectInScopeAsync(scope, request.FindingId, ct);
        EnsureRunMatchesFindingAuthorityRun(request.RunId, finding);
        await EnsureRunInScopeWhenProvidedAsync(scope, request.RunId, ct);

        return await _findingDispositionService.RecordAsync(
            request,
            scope,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<RecordBulkFindingDispositionResponse> RecordBulkDispositionAsync(
        RecordBulkFindingDispositionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();
        List<string> normalizedFindingIds = request.FindingIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        List<string> updated = [];

        foreach (string normalizedFindingId in normalizedFindingIds)
        {
            await EnsureFindingInScopeAsync(scope, normalizedFindingId, ct);
        }

        foreach (string normalizedFindingId in normalizedFindingIds)
        {

            string? tradeOffAcknowledgment = null;

            if (request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Accepted)
            {
                tradeOffAcknowledgment = string.IsNullOrWhiteSpace(request.TradeOffAcknowledgment)
                    ? request.Rationale
                    : request.TradeOffAcknowledgment;
            }

            RecordFindingDispositionRequest normalized = new()
            {
                FindingId = normalizedFindingId,
                RunId = Guid.Empty,
                Disposition = request.Disposition,
                Rationale = request.Rationale,
                TradeOffAcknowledgment = tradeOffAcknowledgment,
                RevisitDueUtc = request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Deferred && request.RevisitDueUtc is null
                    ? TimeProvider.System.GetUtcNow().AddDays(30)
                    : request.RevisitDueUtc,
                EvidenceRequestText = request.EvidenceRequestText,
            };

            await _findingDispositionService.RecordAsync(normalized, scope, actorId, ct);
            updated.Add(normalizedFindingId);
        }

        if (updated.Count == 0)
        {
            throw new ArgumentException(
                "None of the provided findings were found in the current scope.",
                nameof(request.FindingIds));
        }

        return new RecordBulkFindingDispositionResponse
        {
            ProcessedCount = updated.Count,
            UpdatedFindingIds = updated,
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FindingDispositionEventDto>> ListDispositionsAsync(
        string findingId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!await IsFindingInScopeAsync(scope, findingId, ct))
            return [];

        return await _findingDispositionService.ListHistoryAsync(scope, findingId, ct);
    }

    private async Task EnsureRunInScopeWhenProvidedAsync(ScopeContext scope, Guid? runId, CancellationToken ct)
    {
        if (runId is not Guid resolvedRunId || resolvedRunId == Guid.Empty)
            return;

        Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, resolvedRunId, ct)
            .ConfigureAwait(false);

        if (run is null)
            throw new RunNotFoundException(resolvedRunId.ToString("D"));
    }

    private async Task EnsureManifestMatchesRunWhenProvidedAsync(
        ScopeContext scope,
        Guid? runId,
        Guid? manifestId,
        CancellationToken ct)
    {
        if (manifestId is Guid resolvedManifestId && resolvedManifestId != Guid.Empty)
        {
            if (runId is not Guid resolvedRunId || resolvedRunId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Run id is required when manifest id is specified.",
                    nameof(runId));
            }

            Persistence.Models.RunRecord? run = await _runRepository
                .GetByIdAsync(scope, resolvedRunId, ct)
                .ConfigureAwait(false);

            if (run is null)
                throw new RunNotFoundException(resolvedRunId.ToString("D"));

            if (run.GoldenManifestId is not Guid boundManifest || boundManifest != resolvedManifestId)
            {
                throw new GoldenManifestVersionNotFoundException(
                    resolvedManifestId.ToString("D"),
                    resolvedRunId.ToString("D"));
            }

            return;
        }

        if (runId is not Guid _ || runId == Guid.Empty)
            return;
    }

    private async Task EnsureFindingInScopeAsync(ScopeContext scope, string findingId, CancellationToken ct)
    {
        _ = await RequireFindingInspectInScopeAsync(scope, findingId, ct);
    }

    private async Task<FindingInspectResponse> RequireFindingInspectInScopeAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct)
    {
        findingId = findingId.Trim();

        FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId,
            ct,
            FindingInspectReadOptions.MetadataOnly);

        if (finding is null)
            throw new InvalidOperationException("Finding was not found.");

        return finding;
    }

    private static void EnsureRunMatchesFindingAuthorityRun(Guid? runId, FindingInspectResponse finding)
    {
        if (runId is not Guid resolvedRunId || resolvedRunId == Guid.Empty)
            return;

        if (finding.RunId != Guid.Empty && finding.RunId != resolvedRunId)
        {
            throw new ArgumentException(
                "runId does not match the finding's authority run.",
                nameof(runId));
        }
    }

    private async Task<bool> IsFindingInScopeAsync(ScopeContext scope, string findingId, CancellationToken ct)
    {
        findingId = findingId.Trim();

        FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId,
            ct,
            FindingInspectReadOptions.MetadataOnly);

        return finding is not null;
    }

    /// <inheritdoc />
    public async Task<RiskExceptionRecord> CreateRiskExceptionAsync(
        CreateRiskExceptionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        CreateRiskExceptionRequest normalized = new()
        {
            FindingId = request.FindingId.Trim(),
            RunId = request.RunId,
            ManifestId = request.ManifestId,
            OwnerUserId = request.OwnerUserId,
            Rationale = request.Rationale,
            EvidenceRef = request.EvidenceRef,
            ExpiresAtUtc = request.ExpiresAtUtc,
        };

        FindingInspectResponse finding = await RequireFindingInspectInScopeAsync(scope, normalized.FindingId, ct);
        EnsureRunMatchesFindingAuthorityRun(normalized.RunId, finding);
        await EnsureRunInScopeWhenProvidedAsync(scope, normalized.RunId, ct);
        await EnsureManifestMatchesRunWhenProvidedAsync(scope, normalized.RunId, normalized.ManifestId, ct);

        return await _riskExceptionService.CreateAsync(
            normalized,
            scope,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RiskExceptionRecord>> ListRiskExceptionsAsync(
        Guid? projectId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!GovernanceQueryProjectScope.TryResolve(projectId, scope, out Guid resolvedProjectId))
            return [];

        IReadOnlyList<RiskExceptionRecord> records = await _riskExceptionService.ListActiveAsync(
            scope.TenantId,
            resolvedProjectId,
            ct);

        return RiskExceptionScope.FilterActiveToScope(records, scope);
    }

    /// <inheritdoc />
    public async Task RevokeRiskExceptionAsync(Guid riskExceptionId, CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await EnsureRiskExceptionInScopeAsync(scope, riskExceptionId, ct);

        await _riskExceptionService.RevokeAsync(
            scope.TenantId,
            riskExceptionId,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<RiskExceptionRecord> RenewRiskExceptionAsync(
        Guid riskExceptionId,
        RenewRiskExceptionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await EnsureRiskExceptionInScopeAsync(scope, riskExceptionId, ct);

        return await _riskExceptionService.RenewAsync(
            scope.TenantId,
            riskExceptionId,
            request,
            _actorContext.GetActorId(),
            ct);
    }

    private async Task EnsureRiskExceptionInScopeAsync(ScopeContext scope, Guid riskExceptionId, CancellationToken ct)
    {
        RiskExceptionRecord? record = await _riskExceptionService.GetByIdAsync(scope.TenantId, riskExceptionId, ct);

        if (!RiskExceptionScope.IsVisibleInScope(record, scope))
            throw new InvalidOperationException("Risk exception was not found.");
    }

    /// <inheritdoc />
    public async Task<bool> TryResolveFindingMergeConflictAsync(
        Guid runId,
        string findingId,
        ResolveFindingMergeConflictRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await EnsureRunInScopeWhenProvidedAsync(scope, runId, ct);

        bool resolved = await _findingMergeConflictResolutionService.TryResolveAsync(
            scope,
            runId,
            findingId,
            request.Action,
            ct).ConfigureAwait(false);

        if (!resolved)
            return false;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingMergeConflictResolved,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId,
                    action = request.Action.ToString(),
                }),
            },
            ct);

        return true;
    }
}
