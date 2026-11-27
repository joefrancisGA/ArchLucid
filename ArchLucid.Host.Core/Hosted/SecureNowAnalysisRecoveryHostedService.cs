using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>Reclaims durable SecureNow admissions from active tenant catalogs.</summary>
public sealed class SecureNowAnalysisRecoveryHostedService(
    IServiceScopeFactory services,
    IOptionsMonitor<AnalysisStageExecutionOptions> options,
    HostLeaderElectionCoordinator election,
    ILogger<SecureNowAnalysisRecoveryHostedService> logger)
    : LeaderElectedOutboxHostedServiceBase(election, logger)
{
    protected override string LeaseName => "hosted:securenow-analysis-recovery";
    protected override string LoopName => "SecureNow analysis recovery";
    protected override Func<CancellationToken, Task<int>> ProcessPendingBatch => DrainAsync;

    private async Task<int> DrainAsync(CancellationToken ct)
    {
        if (!options.CurrentValue.EnableDurableSecureNowRecovery)
            return 0;

        using IServiceScope directoryScope = services.CreateScope();
        ITenantRepository tenants = directoryScope.ServiceProvider.GetRequiredService<ITenantRepository>();
        int attempted = 0;

        foreach (TenantRecord tenant in await tenants.ListAsync(ct))
        {
            ct.ThrowIfCancellationRequested();

            if (tenant.Id == Guid.Empty || tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            try
            {
                using IDisposable tenantBoundary = AmbientScopeContext.Push(new ScopeContext { TenantId = tenant.Id });
                using IServiceScope tenantServices = services.CreateScope();
                ISecureNowAnalysisRecoveryJobs? jobs = tenantServices.ServiceProvider.GetService<ISecureNowAnalysisRecoveryJobs>();

                if (jobs is null)
                    return 0;

                foreach (SecureNowAnalysisRecoveryJob job in await jobs.ListPendingAsync(tenant.Id, ct))
                {
                    ct.ThrowIfCancellationRequested();

                    if (job.TenantId != tenant.Id || job.WorkspaceId == Guid.Empty || job.ProjectId == Guid.Empty)
                        continue;

                    using IDisposable projectBoundary = AmbientScopeContext.Push(job.CreateScope());
                    using IServiceScope attemptServices = services.CreateScope();

                    try
                    {
                        await attemptServices.ServiceProvider.GetRequiredService<AzureInventorySnapshotPostMaterializeCoordinator>()
                            .ResumeJobAsync(job, ct);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
                    {
                        logger.LogWarning(ex, "SecureNow recovery attempt ended. SnapshotId={SnapshotId}", job.SnapshotId);
                    }

                    attempted++;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
            {
                logger.LogWarning(ex, "SecureNow recovery could not drain tenant {TenantId}.", tenant.Id);
            }
        }

        return attempted;
    }
}
