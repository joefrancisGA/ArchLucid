using ArchLucid.Application.Operator;
using ArchLucid.Application.Operator.Probes;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Metering;
using ArchLucid.Host.Composition.Metering;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterTenancyMeteringAndSecrets(IServiceCollection services, IConfiguration configuration)
    {
        RegisterTenancyMetering(services, configuration);
        RegisterTenancyBillingSecrets(services, configuration);
        RegisterTenancyLlmWallet(services, configuration);
    }
}
