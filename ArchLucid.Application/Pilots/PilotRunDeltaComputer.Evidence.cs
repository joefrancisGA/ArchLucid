using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Pilots;

public sealed partial class PilotRunDeltaComputer
{
    private Task<decimal?> TryResolveEstimatedUsdSavingsAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken) =>
        _tenantEstimatedUsdSavingsResolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, cancellationToken);

    private async Task<FindingsSnapshot?> TryLoadFindingsSnapshotAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken cancellationToken)
    {
        try
        {
            FindingsSnapshot? snapshot =
                await _findingsSnapshotRepository.GetCoverageProjectionByIdAsync(scope, findingsSnapshotId, cancellationToken);

            if (snapshot?.Findings is null || snapshot.Findings.Count == 0)
                return null;

            return snapshot;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex,
                "Pilot delta: findings snapshot {FindingsSnapshotId} unavailable; reporting zero findings from agent results.",
                findingsSnapshotId);

            return null;
        }
    }

    private async Task<(int Count, bool Truncated)> TryCountAuditRowsAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return (0, false);
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            AuditEventFilter filter = new()
            {
                RunId = runGuid,
                Take = 1,
            };
            int count = await _auditRepository.CountFilteredAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, filter, cancellationToken);
            return (count, false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Pilot delta: audit row count unavailable for run {RunId}; reporting 0.", runId);
            return (0, false);
        }
    }

    private async Task<FindingEvidenceChainResponse?> TryBuildEvidenceChainAsync(string runId, string findingId, CancellationToken cancellationToken)
    {
        try
        {
            return await _evidenceChainService.BuildAsync(runId, findingId, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Pilot delta: evidence chain unavailable for run {RunId} finding {FindingId}; omitting chain pointers.",
                LogSanitizer.Sanitize(runId),
                LogSanitizer.Sanitize(findingId)); // codeql[cs/log-forging]: operational ids sanitized immediately above (params boxing).
            return null;
        }
    }
}
