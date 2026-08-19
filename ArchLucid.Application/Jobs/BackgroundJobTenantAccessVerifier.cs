using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Resolves tenant scope from serialized background-job work units — GUID secrecy alone is not authorization.
/// </summary>
public sealed class BackgroundJobTenantAccessVerifier(
    IBackgroundJobWorkUnitAccessor workUnitAccessor,
    IRunRepository runRepository) : IBackgroundJobTenantAccessVerifier
{
    private readonly IBackgroundJobWorkUnitAccessor _workUnitAccessor =
        workUnitAccessor ?? throw new ArgumentNullException(nameof(workUnitAccessor));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<bool> IsAccessibleAsync(
        string jobId,
        ScopeContext callerScope,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(jobId);
        ArgumentNullException.ThrowIfNull(callerScope);

        BackgroundJobWorkUnit? workUnit = await _workUnitAccessor.TryGetAsync(jobId, cancellationToken);

        if (workUnit is null)
            return false;

        return workUnit switch
        {
            AnalysisReportDocxWorkUnit w => await RunBelongsToScopeAsync(w.Payload.RunId, callerScope, cancellationToken),
            ConsultingDocxWorkUnit w => await RunBelongsToScopeAsync(w.Payload.RunId, callerScope, cancellationToken),
            TenantDeletionWorkUnit w => w.Payload.TenantId == callerScope.TenantId,
            ItsmOutboundCreateWorkUnit w => ScopeMatches(w.Payload, callerScope),
            _ => false
        };
    }

    private static bool ScopeMatches(ItsmOutboundCreateJobPayload payload, ScopeContext callerScope)
    {
        return payload.TenantId == callerScope.TenantId
               && payload.WorkspaceId == callerScope.WorkspaceId
               && payload.ProjectId == callerScope.ProjectId;
    }

    private async Task<bool> RunBelongsToScopeAsync(
        string runId,
        ScopeContext callerScope,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid parsedRunId))
            return false;

        RunRecord? run = await _runRepository.GetByIdAsync(callerScope, parsedRunId, cancellationToken);

        return run is not null;
    }
}
