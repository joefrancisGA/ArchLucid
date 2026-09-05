using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
    /// <inheritdoc />
    public async Task<bool> TryResolveFindingMergeConflictAsync(
        Guid runId,
        string findingId,
        ResolveFindingMergeConflictRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await EnsureRunInScopeWhenProvidedAsync(scope, runId, ct);

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            ct);

        bool resolved = await _findingMergeConflictResolutionService.TryResolveAsync(
            scope,
            runId,
            findingId,
            request.Action,
            ct).ConfigureAwait(false);

        if (!resolved)
            return false;

        FindingInspectResponse conflictFinding = await RequireFindingInspectInScopeAsync(scope, findingId, ct);
        EnsureRunMatchesFindingAuthorityRun(runId, conflictFinding);
        string canonicalFindingId = conflictFinding.FindingId;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingMergeConflictResolved,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId = canonicalFindingId,
                    action = request.Action.ToString(),
                }),
            },
            ct);

        return true;
    }
}
