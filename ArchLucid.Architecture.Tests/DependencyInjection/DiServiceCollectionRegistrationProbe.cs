using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Architecture.Tests.DependencyInjection;

/// <summary>
///     Checks whether a service type appears in an <see cref="IServiceCollection" /> descriptor list.
/// </summary>
internal static class DiServiceCollectionRegistrationProbe
{
    public static bool IsRegistered(IServiceCollection services, Type serviceType)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(serviceType);

        foreach (ServiceDescriptor descriptor in services)
        {
            if (descriptor.ServiceType == serviceType)
                return true;
        }

        return false;
    }
}
