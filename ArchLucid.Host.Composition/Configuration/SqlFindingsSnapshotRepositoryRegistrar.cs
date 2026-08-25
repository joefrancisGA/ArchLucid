using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for findings snapshot, inspect, mute, remediation, external tracking, and decision trace repositories.
/// </summary>
internal static class SqlFindingsSnapshotRepositoryRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IFindingsSnapshotRepository>(sp =>
        {
            SqlFindingsSnapshotRepository inner = sp.GetRequiredService<SqlFindingsSnapshotRepository>();
            HotPathCacheOptions hotPath = sp.GetRequiredService<IOptions<HotPathCacheOptions>>().Value;

            if (!hotPath.Enabled)
                return inner;

            return new CachingFindingsSnapshotRepository(
                inner,
                sp.GetRequiredService<IHotPathReadCache>(),
                sp.GetRequiredService<IScopeContextProvider>());
        });
        services.AddScoped<SqlFindingsSnapshotRepository>();
        services.AddScoped<IFindingInspectReadRepository, DapperFindingInspectReadRepository>();
        services.AddScoped<IRunFindingExternalTrackingReadRepository, DapperRunFindingExternalTrackingReadRepository>();
        services.AddScoped<IFindingRecordMuteRepository, DapperFindingRecordMuteRepository>();
        services.AddScoped<IFindingRecordRemediationAssignmentRepository, DapperFindingRecordRemediationAssignmentRepository>();
        services.AddScoped<IDecisionTraceRepository, SqlDecisionTraceRepository>();
    }
}
