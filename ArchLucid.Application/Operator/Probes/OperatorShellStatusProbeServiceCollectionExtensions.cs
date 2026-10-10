using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Alerts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Operator.Probes;

internal static class OperatorShellStatusProbeServiceCollectionExtensions
{
    public static IServiceCollection AddOperatorShellStatusProbes(this IServiceCollection services)
    {
        services.AddScoped<OperatorShellTrialStatusProbe>();
        services.AddScoped<OperatorShellCatalogMigrationProbe>();
        services.AddScoped<OperatorShellLlmMonthlyBudgetProbe>();
        services.AddScoped<OperatorShellAlertsInboxProbe>();
        services.AddScoped<OperatorShellUsageStatusProbe>();
        services.AddScoped<OperatorShellHomepageSettingsProbe>();
        services.AddScoped<OperatorShellStickinessProbe>();
        services.AddScoped<OperatorShellAssignedToMeFindingsProbe>();
        services.AddScoped<OperatorShellReviewsAwaitingActionProbe>();
        return services;
    }
}
