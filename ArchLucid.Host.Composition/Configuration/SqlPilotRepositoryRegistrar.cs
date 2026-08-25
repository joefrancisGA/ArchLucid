using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Pilots;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for pilot scorecard, baseline, closeout, and team checklist repositories.
/// </summary>
internal static class SqlPilotRepositoryRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IPilotScorecardMetricsReader, DapperPilotScorecardMetricsReader>();
        services.AddScoped<IPilotReportCardMetricsReader, DapperPilotReportCardMetricsReader>();
        services.AddScoped<IPilotBaselineRepository, DapperPilotBaselineRepository>();
        services.AddScoped<IPilotCloseoutRepository, DapperPilotCloseoutRepository>();
        services.AddScoped<ICorePilotTeamChecklistRepository, SqlCorePilotTeamChecklistRepository>();
    }
}
