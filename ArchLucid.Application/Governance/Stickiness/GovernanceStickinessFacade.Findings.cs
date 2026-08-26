using System.Text.Json;

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

        await EnsureFindingInScopeAsync(scope, request.FindingId, ct);

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
        List<string> updated = [];

        foreach (string findingId in request.FindingIds)
        {
            RecordFindingDispositionRequest normalized = new()
            {
                FindingId = findingId,
                RunId = Guid.Empty,
                Disposition = request.Disposition,
                Rationale = request.Rationale,
                RevisitDueUtc = request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Deferred && request.RevisitDueUtc is null
                    ? TimeProvider.System.GetUtcNow().AddDays(30)
                    : request.RevisitDueUtc,
            };

            try
            {
                await EnsureFindingInScopeAsync(scope, findingId, ct);
                await _findingDispositionService.RecordAsync(normalized, scope, actorId, ct);
                updated.Add(findingId);
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
            }
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

        return await _findingDispositionService.ListHistoryAsync(scope.TenantId, findingId, ct);
    }

    private async Task EnsureFindingInScopeAsync(ScopeContext scope, string findingId, CancellationToken ct)
    {
        if (!await IsFindingInScopeAsync(scope, findingId, ct))
        {
            throw new ArgumentException(
                $"Finding '{findingId.Trim()}' was not found in the current scope.",
                nameof(findingId));
        }
    }

    private async Task<bool> IsFindingInScopeAsync(ScopeContext scope, string findingId, CancellationToken ct)
    {
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

        await EnsureFindingInScopeAsync(scope, request.FindingId, ct);

        return await _riskExceptionService.CreateAsync(
            request,
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

        return await _riskExceptionService.ListActiveAsync(
            scope.TenantId,
            resolvedProjectId,
            ct);
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
