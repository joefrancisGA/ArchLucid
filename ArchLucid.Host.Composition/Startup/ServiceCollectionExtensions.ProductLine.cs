using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductCapability;
using ArchLucid.Core.ProductLine;
using ArchLucid.Host.Core.ProductLine;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterProductLineRequestAccessor(IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<ProductLineDeploymentOptions>(configuration.GetSection(ProductLineDeploymentOptions.SectionName));
        services.TryAddSingleton<IProductLineRequestAccessor, ProductLineRequestAccessor>();
        services.TryAddSingleton<IProductCapabilityControllerCatalog, ProductCapabilityControllerCatalog>();
    }
}
