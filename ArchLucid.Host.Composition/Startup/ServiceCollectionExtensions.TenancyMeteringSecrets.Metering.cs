using ArchLucid.Application.Operator;
using ArchLucid.Application.Operator.Probes;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Metering;
using ArchLucid.Host.Composition.Metering;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterTenancyMetering(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ArchLucid.Core.Metering.MeteringOptions>(
            configuration.GetSection(ArchLucid.Core.Metering.MeteringOptions.SectionName));
        services.PostConfigure<ArchLucid.Core.Metering.MeteringOptions>(static options => options.Normalize());

        services.AddScoped<IUsageMeteringService, UsageMeteringService>();
        services.AddSingleton<ApiRequestUsageEventBuffer>();
        services.AddSingleton<IApiRequestUsageEventBuffer>(static sp => sp.GetRequiredService<ApiRequestUsageEventBuffer>());
        services.AddHostedService<ApiRequestUsageEventBatchFlushHostedService>();
        services.AddScoped<ITenantUsageStatusService, TenantUsageStatusService>();
        services.AddOperatorShellStatusProbes();
        services.AddScoped<IOperatorShellStatusService, OperatorShellStatusService>();
        services.AddSingleton<ITenantTrialSeatSkipCache, TenantTrialSeatSkipCache>();
        services.AddScoped<TrialSeatAccountant>();
    }
}
