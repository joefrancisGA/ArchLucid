namespace ArchLucid.Architecture.Tests.WorkerCapability;

internal static class ProductCapabilityWorkerMapWriter
{
    internal static ProductCapabilityWorkerMapDocument BuildFromDiscovery()
    {
        IReadOnlyList<Type> hostedServiceTypes = WorkerHostedServiceDiscovery.DiscoverWorkerHostedServiceTypes();

        List<ProductCapabilityWorkerMapEntry> entries = hostedServiceTypes
            .Select(static type => new ProductCapabilityWorkerMapEntry
            {
                TypeName = type.FullName!,
                Capability = WorkerCapabilityClassifier.Classify(type),
                Status = "assigned",
                OwnerNote = null,
            })
            .OrderBy(static entry => entry.TypeName, StringComparer.Ordinal)
            .ToList();

        return new ProductCapabilityWorkerMapDocument
        {
            Version = 1,
            HostedServices = entries,
        };
    }
}
