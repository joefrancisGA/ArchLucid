using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Jobs;

/// <inheritdoc cref="IBackgroundJobWorkUnitScopeResolver" />
public sealed class BackgroundJobWorkUnitScopeResolver(IRunRepository runRepository) : IBackgroundJobWorkUnitScopeResolver
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public Task<ScopeContext> ResolveAsync(BackgroundJobWorkUnit workUnit, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(workUnit);

        return workUnit switch
        {
            AnalysisReportDocxWorkUnit w => ResolveFromRunIdAsync(w.Payload.RunId, cancellationToken),
            ConsultingDocxWorkUnit w => ResolveFromRunIdAsync(w.Payload.RunId, cancellationToken),
            TenantDeletionWorkUnit w => Task.FromResult(new ScopeContext { TenantId = w.Payload.TenantId }),
            ItsmOutboundCreateWorkUnit w => Task.FromResult(ItsmOutboundCreateJobProcessor.ToScopeContext(w.Payload)),
            _ => throw new InvalidOperationException($"Unsupported background job work unit: {workUnit.GetType().Name}.")
        };
    }

    private async Task<ScopeContext> ResolveFromRunIdAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            throw new InvalidOperationException($"Run '{runId}' is not a valid run identifier.");

        RunRecord? record = await _runRepository.GetByRunIdAdminAsync(runGuid, cancellationToken).ConfigureAwait(false);

        if (record is null)
            throw new InvalidOperationException($"Run '{runId}' was not found.");

        return new ScopeContext
        {
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ProjectId = record.ScopeProjectId
        };
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
