using ArchLucid.Application.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
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

        Guid runIdForGuard = normalized.RunId ?? finding.RunId;

        if (runIdForGuard != Guid.Empty)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runIdForGuard,
                scope,
                _authorityQueryService,
                _manifestHashService,
                ct);
        }

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

        RiskExceptionRecord? existing = await _riskExceptionService.GetByIdAsync(scope.TenantId, riskExceptionId, ct);

        if (existing?.RunId is { } renewRunId && renewRunId != Guid.Empty)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                renewRunId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                ct);
        }

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
}
