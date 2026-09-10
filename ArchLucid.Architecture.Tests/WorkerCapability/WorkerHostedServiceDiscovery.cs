using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Architecture.Tests.WorkerCapability;

/// <summary>Discovers concrete hosted-service types registered for Worker or Combined hosting roles.</summary>
internal static class WorkerHostedServiceDiscovery
{
    internal static IReadOnlyList<Type> DiscoverWorkerHostedServiceTypes()
    {
        HashSet<Type> types = [];

        foreach (ArchLucidHostingRole role in new[] { ArchLucidHostingRole.Worker, ArchLucidHostingRole.Combined })
        {
            ServiceCollection services = WorkerCompositionServiceCollectionBuilder.BuildForRole(role);

            foreach (Type hostedType in ExtractHostedServiceTypes(services))
                types.Add(hostedType);
        }

        return types
            .OrderBy(static type => type.FullName, StringComparer.Ordinal)
            .ToArray();
    }

    private static IEnumerable<Type> ExtractHostedServiceTypes(IServiceCollection services)
    {
        bool inMemoryBackgroundJobQueueRegistered = services.Any(static descriptor =>
            descriptor.ServiceType == typeof(IBackgroundJobQueue)
            && descriptor.ImplementationType == typeof(InMemoryBackgroundJobQueue));

        foreach (ServiceDescriptor descriptor in services)
        {
            if (descriptor.ServiceType == typeof(IHostedService) && descriptor.ImplementationType is not null)
            {
                yield return descriptor.ImplementationType;
                continue;
            }

            if (descriptor.ServiceType == typeof(IHostedService)
                && descriptor.ImplementationFactory is not null
                && inMemoryBackgroundJobQueueRegistered)
            {
                yield return typeof(InMemoryBackgroundJobQueue);
                continue;
            }

            if (descriptor.ImplementationType is not null
                && typeof(IHostedService).IsAssignableFrom(descriptor.ImplementationType))
            {
                yield return descriptor.ImplementationType;
            }
        }
    }
}
